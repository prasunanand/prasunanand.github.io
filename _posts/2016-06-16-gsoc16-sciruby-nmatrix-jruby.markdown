---
layout: post
title:  "JRuby Port of NMatrix"
date:   2016-06-16 18:18:41 +0530
categories: ruby gem
comments: true
author: Prasun Anand
banner: /images/gsoc2016.jpeg
---

NMatrix for MRI has become a fairly well-established project. NMatrix is SciRuby’s numerical matrix core, implementing dense matrices as well as two types of sparse (linked-list-based and Yale/CSR). The backend has been written in C/C++ and relies on ATLAS/ CBLAS / CLAPACK and standard LAPACK for several of its linear algebra operations. 

With JRuby + Truffle + Graal becoming very fast compared to MRI, a lot of ruby developers are switching to JRuby. JRuby compiles to byte code making it fast and also does heavy optimizations before and after generating byte code. However NMatrix does not run on JRuby because of C-libraries, and as a result they’re not usable on JRuby. The more of these libraries we have ports for, the less pain JRuby users suffer during migration.

This project aims to port NMatrix to JRuby. NMatrix being a huge library; we aim to implement NMatrix on Jruby for dense matrices during the summers. Every feature of NMatrix that has been ported to JRuby will be benchmarked versus NMatrix-CRuby.

### Benchmarking

After the first iteration, we benchmarked NMatrix JRuby versus NMatrix CRuby for matrix addition, subtraction and multiplication and got some interesting results.

![Alt Matrix Addition](/assets/iter1/add.png?raw=true "Fig.1. Matrix Addition")
![Alt Matrix Subtraction](/assets/iter1/subt.png?raw=true "Fig.2. Matrix Subtraction")
![Alt Matrix Multiplication](/assets/iter1/mult.png?raw=true "Fig.3. Matrix Multiplication")

The results were promising but there was a huge scope for improvement. The following sections discuss how we built the new backend and how we optimized it after the first iteration.

### Creating a new backend

The java backend aims to create a wrapper around Commons Maths. The Apache Commons Mathematics Library is a library of lightweight, self-contained mathematics and statistics components addressing the most common problems not available in the Java programming language or Commons Lang. It has a very good community support. We used Version: 3.6.1.

Like any other ruby gem with c extensions, the backend code lies within ext/ directory. The new java backend has been placed in ext/nmatrix_java/ directory.

**NMatrix Creation for arbitrary dimension:**
We started with double dense matrices and as soon as double matrices are completely implemented; we will implement other data-types. The JNMatrix class stores the the NMatrix elements. The elements of a matrix are stored as a flat_array using the ArrayRealVector class provided by Commons Math. ArrayRealVector class provides methods for operations like addition, subtraction and multiplication. The function mapToSelf(Univariate function) maps a function to each element that facilitates using different element-wise operations like sin(), cos(), floor(), ceil().

When we have matrices of two dimensions, we use JNMatrixTwoD class. Whenever a new JNMatrix object is initialised the constructor checks if it is two dimensional. If true a JNMatrixTwoD object is initialised. Now we can operate on 2-D matrices. JNMatrixTwoD wraps Array2DRowRealMatrix and BlockRealMatrix. They store elements of the matrix in row major format. BlockRealMatrix implementation is specially designed to be cache-friendly.Square blocks are stored as small arrays and allow efficient traversal of data both in row major direction and columns major direction, one block at a time. This greatly increases performances for algorithms that use crossed directions loops like multiplication or transposition. 2D double matrices currently support determinants, inverse, isSymmetric? .

Connecting with the new backend
The nmatrix c extension uses lib/nmatrix/nmatrix.rb to connect the backend and frontend. It loads the nmatrix.so file. The shared objects act as a bridge between the c api and ruby frontend code. For java extensions; we created a lib/nmatrix/nmatrix_java.rb file that gets loaded only when java is detected as ruby platform.

*lib/nmatrix/nmatrix.rb*

```ruby
def jruby?
  /java/ === RUBY_PLATFORM
end

if jruby?
    require 'nmatix_java.rb'
else
    require "nmatrix.so"
end
```

*lib/nmatrix/nmatrix_java.rb*

```ruby
require 'java'
require_relative '../../ext/nmatrix_java/vendor/commons-math3-3.6.1.jar'
require_relative '../../ext/nmatrix_java/target/nmatrix.jar'
```

The lib/nmatrix/nmatrix_java.rb file further creates a NMatrix class and binds it with java backend apis. This file is analogous to ruby_nmatrix.c where NMatrix class is defined along with the methods.


NMatrix JRuby doesn’t seem to be RAM friendly as it consumes a lot of RAM as compared to NMatrix-CRuby.

For 6GB RAM we can multiply 5000 x 5000 matrix with a 5000 x 5000 RAM.
To multiply a 6,000 x 6,000 matrix with a 6,000*6,000 matrix we need 10gb ram. 

This is evident that error scales up as we scale up the size. For example initialization of a 6000 by 60000 matrix  takes 9.89 to 13 seconds.

For a RealMatrix interface, the type of matrix returned depends on the dimension. Below 2^12 elements (i.e. 4096 elements or 64*64 for a square matrix) which can be stored in a 32kB array,  a Array2DRowRealMatrix instance is built. Above this threshold a BlockRealMatrix instance is built.


**Block Size**
In java applications, data is read from and written to disk in units known as blocks. The Block Size property specifies the number of bytes per block.

According to Commons Math a BlockRealMatrix is a

"Cache-friendly implementation of RealMatrix using a flat arrays to store square blocks of the matrix.
This implementation is specially designed to be cache-friendly. Square blocks are stored as small arrays and allow efficient traversal of data both in row major direction and columns major direction, one block at a time. This greatly increases performances for algorithms that use crossed directions loops like multiplication or transposition.

The size of square blocks is a static parameter. It may be tuned according to the cache size of the target computer processor. As a rule of thumbs, it should be the largest value that allows three blocks to be simultaneously cached (this is necessary for example for matrix multiplication). The default value is to use 52x52 blocks which is well suited for processors with 64k L1 cache (one block holds 2704 values or 21632 bytes). This value could be lowered to 36x36 for processors with 32k L1 cache.

The regular blocks represent BLOCK_SIZE x BLOCK_SIZE squares. Blocks at right hand side and bottom side which may be smaller to fit matrix dimensions. The square blocks are flattened in row major order in single dimension arrays which are therefore BLOCK_SIZE2 elements long for regular blocks. The blocks are themselves organized in row major order.

As an example, for a block size of 52x52, a 100x60 matrix would be stored in 4 blocks. Block 0 would be a double[2704] array holding the upper left 52x52 square, block 1 would be a double[416] array holding the upper right 52x8 rectangle, block 2 would be a double[2496] array holding the lower left 48x52 rectangle and block 3 would be a double[384] array holding the lower right 48x8 rectangle.
The layout complexity overhead versus simple mapping of matrices to java arrays is negligible for small matrices (about 1%). The gain from cache efficiency leads to up to 3-fold improvements for matrices of moderate to large size."

**Initialialization of a matrix in NMatrix-jruby**

*lib/nmatrix/nmatrix_java.rb*

```ruby
def initialize
  @shape = [shape,shape] unless shape.is_a?(Array)
  @s = elements
  @nmat= JNMatrix.new(@shape, @elements , "FLOAT32", "DENSE_STORE" )
end
```

*ext/nmatrix_java/nmatrix/JNMatrix.java*

```java
public JNMatrixTwoD(int[] shape, double[] oneDArray){
    set_rows(shape[0]);
    set_cols(shape[1]);

    this.nmat2d = MatrixUtils.createRealMatrix(this.two_d_array_generator(shape,         oneDArray));
    this.nmat2dblock = new BlockRealMatrix(this.two_d_array_generator(shape,  oneDArray));
    if (shape[0] == shape[1]){
      solver = new LUDecomposition(this.nmat2d);
    }
  }
```

*ext/nmatrix_java/nmatrix/JNMatrixTwoD.java*

```java
public static RealMatrix createRealMatrix(final int rows, final int columns) {
        return (rows * columns <= 4096) ?
                new Array2DRowRealMatrix(rows, columns) : new BlockRealMatrix(rows, columns);
    }
```
*lib/nmatrix/nmatrix_java.rb* ( Matrix Addition )

```ruby
def +(other)
  result = nil
  if (other.is_a?(NMatrix))
    #check dimension
    #check shape
    if (@dim != other.dim)
      raise Exception.new("cannot add matrices with different dimension")
    end
    #check shape
  (0...dim).each do |i|
    if (@shape[i] != other.shape[i])
      raise Exception.new("cannot add matrices with different shapes");
    end
  end
  resultArray = @nmat.add(other.nmat).to_a
  result = NMatrix.new(shape, resultArray,  dtype: :int64)
  else
  resultArray = @nmat.mapAddToSelf(other).to_a
  result = NMatrix.new(shape, resultArray,  dtype: :int64)
  end
  result
end
```

*lib/nmatrix/nmatrix_java.rb* ( Matrix Multiplication )

```ruby
def dot(other)
  result = nil
  if (other.is_a?(NMatrix))
    #check dimension
    #check shape
    if (@shape.length!=2 || other.shape.length!=2)
      raise Exception.new("please convert array to nx1 or 1xn NMatrix first")
      return nil
    end
    if (@shape[1] != other.shape[0])
      raise Exception.new("incompatible dimensions")
      return nil
    end
    resultArray = @nmat.twoDMat.multiply(other.nmat.twoDMat).to_a
    newShape= [@shape[0],other.shape[1]]
    result = NMatrix.new(newShape, resultArray,  dtype: :int64)
  else
    raise Exception.new("cannot have dot product with a scalar");
  end
  return result;
end
```

*ext/nmatrix_java/nmatrix/JNMatrixTwoD.java*

```java
public double[] multiply(JNMatrixTwoD other){
  RealMatrix result = this.nmat2d.multiply(other.nmat2d);
  return this.one_d_array_generator(rows, cols, result.getData());
}
```


Lets take a look at what happens when we benchmark matrix multiplication.

```ruby
shapeArray = [
              [10,10],[50,50],                      // array2dRowRealMatrix
              [100,100],[500,500], 
              [1000,1000],[2000,2000],[3000,3000],  // BlockRealMatrix
              [4000,4000],[5000,5000],
            ]
```

For shape = [5000,5000] we generate an array of random elements.

RAM size calculation for storing a single matrix of 5,000 x 5,000 elements.
      
          5000*5000 => 5000/52 x 5000/52

       => 97x97 blocks x 21.632KB (Since,1 block of 2704 elements takes 21.362KB space.)

       => 203,535KB=>203MB=> 0.2GB

        Real array=>  Three arrays of shape 5,000 x 5,000 =>0.2 x 3 = 0.6GB.

        Multiplication => Three matrices of shape 5,000 x 5,000 =>0.2 x 3 = 0.6GB.

In the process, while using multiplication api, commons math creates its own copy which consumes 0.2gb more.
Memory required is at least 1.6gb

Three initializations => 3 x 0.6GB + 0.6GB => 2.4GB <= java copy

Ruby copy would be storing the elements => 0.6GB }<= ruby copy
This calculation thus requires 3 GB.

**Pass by Value and Pass by reference**
In the current code ,The input array is copied, not referenced at a lot of places. This consumes a lot of memory, upsets the Garbage Collector and slows down the program.


**Solution**

 1. Minimise initializations
 2. Don’t copy again and again
 
We need to work only in terms of apis provided by Commons-Math.jar

**After 2nd Iteration**
We benchmarked the code after a few improvements. These are the new graphs that we obtained.

![Alt Matrix Addition](/assets/iter2/add.png?raw=true "Fig.1. Matrix Addition")
![Alt Matrix Subtraction](/assets/iter2/subt.png?raw=true "Fig.2. Matrix Subtraction")
![Alt Matrix Multiplication](/assets/iter2/mult.png?raw=true "Fig.3. Matrix Multiplication")

Instead of using a separate java class to store NMatrix element we used it directly in nmatrix_java.rb.  Now we don’t load nmatrix.jar.

*lib/nmatrix/nmatrix_java.rb*

```ruby
def initialize(shape, elements)
  @shape = [shape,shape] unless shape.is_a?(Array)
  @s = ArrayRealVector(elements)
  if shape.length == 2
    @twoDMat = get_twoDMat(shape,elements)
  end
end
```
Now there are just two initializations (only 1 if we don't have 2D Matrix). Also, there is less "passing by value" to functions.

*lib/nmatrix/nmatrix_java.rb* ( Matrix Addition )

```ruby
def +(other)
  result = NMatrix.new(:copy)
  result.shape = @shape
  if (other.is_a?(NMatrix))
    #check dimension
    #check shape
    if (@dim != other.dim)
      raise Exception.new("cannot add matrices with different dimension")
    end
    #check shape
    (0...dim).each do |i|
      if (@shape[i] != other.shape[i])
        raise Exception.new("cannot add matrices with different shapes");
      end
    end
    result.s = @s.add(other.s)
  else
    result.s = @s.mapAddToSelf(other)
  end
  result
end
```

*lib/nmatrix/nmatrix_java.rb* ( Matrix Multiplication )

```ruby
def dot(other)
  result = nil
  if (other.is_a?(NMatrix))
    #check dimension
    if (@shape.length!=2 || other.shape.length!=2)
      raise Exception.new("please convert array to nx1 or 1xn NMatrix first")
      return nil
    end
    #check shape
    if (@shape[1] != other.shape[0])
      raise Exception.new("incompatible dimensions")
      return nil
    end
    
    result = NMatrix.new(:copy)
    result.shape = @shape
    result.twoDMat = @twoDMat.multiply(other.twoDMat)
    result.s = ArrayRealVector.new(get_oneDArray(@shape, result.twoDMat.getData()))
  else
    raise Exception.new("cannot have dot product with a scalar");
  end
  return result;
end
```

We generate minimum number of copies. In binary and unary operations, the resultant matrix is initialized as a blank nmatrix. We then just point the result of the operation to the storage. So, the JRuby virtual machine doesn’t have to create new copies and the Garbage collector is not upset at all. Thus we see, a great deal of performance boost.

### Autoboxing
Also passing values means coercing them in the required format. Now we don’t have to worry a lot about coercion of values.

### Results
From the above graphs, we see that for addition and subtraction, NMatrix- JRuby is the clear winner.
NMatrix- Lapacke is the clear winner in matrix multiplication. NMatrix-Jruby competes closely with NMatrix-MRI. We can still optimize it to perform better, especially matrix multiplication.


### Tests
We used the existing tests for NMatrix-MRI for the development. The program detects on runtime which method to load.

The table given below summarises how many tests succeed currentlyusing NMatrix-jruby.


|Spec file|Total Test|Success|Failure|Pending|
|------------|:------------:|:-----------:|:-------------:|:-------------:|
|00_nmatrix_spec|188|80|102|6|
|02_slice_spec|144|20|120||
|03_nmatrix_monkeys_spec|12|4|8||
|elementwise_spec|38|4|34||
|math_spec|737|110|598||
|shortcuts_spec|81|21|60||
|stat_spec|72|28|54||



### Improvements and future work
Implement solvers for two dimensional matrices and enumerators by the end of mid term and parallely optimize these features.
After mid-term evaluations, we will be implementing complex dtype using FieldRealVector and FieldMatrix followed by other data-types.

{% if page.comments %}
<div id="disqus_thread"></div>
<script>
/**
* RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
* LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables
*/
/*
var disqus_config = function () {
this.page.url = PAGE_URL; // Replace PAGE_URL with your page's canonical URL variable
this.page.identifier = PAGE_IDENTIFIER; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
};
*/
(function() { // DON'T EDIT BELOW THIS LINE
var d = document, s = d.createElement('script');

s.src = '//prasunanandblog.disqus.com/embed.js';

s.setAttribute('data-timestamp', +new Date());
(d.head || d.body).appendChild(s);
})();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
{% endif %}