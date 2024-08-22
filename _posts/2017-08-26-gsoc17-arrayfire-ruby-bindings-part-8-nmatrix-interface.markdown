---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part VIII : Interfacing to NMatrix)"
date:   2017-08-24 14:00:00 +0530
categories: arrayfire
comments: true
author: Prasun Anand
banner: /images/gsoc2017.png
---

ArrayFire-rb has been interfaced to NMatrix so that they can work together. Sometimes, copying data
from GPU memory to CPU memory and vice versa can be slower than the computation time. Hence, a lot of
developers prefer to use GPU computing for the most time consuming task. The interface between `ArrayFire-rb`
and `NMatrix` helps in providing maximum freedom to the developers to use the libraries of their choice.

This post explains how NMatrix and ArrayFire-rb interface has been created. It starts with adding
nmatrix as a dependency to `arrayfire`.
## Gemspec

```ruby
  gem.add_development_dependency 'nmatrix', '~> 0.2.1'
```

## extconf.rb

Next add `nmatrix.h` header file allowing us to call `nmatrix`'s `C/C++ methods` from `arrayfire`.

```ruby
nmatrix_path = Gem::Specification.find_all_by_name('nmatrix').compact
abort "Cannot locate NMatrix installation" unless nmatrix_path
nmatrix_header_dir = File.join(nmatrix_path[0].require_path)

HEADER_DIRS = [
  '/opt/local/include',
  '/usr/local/include',
  INCLUDEDIR,
  '/usr/include',
  nmatrix_header_dir
]

LIB_DIRS = [
  '/opt/local/lib',
  '/usr/local/lib',
  LIBDIR,
  '/usr/lib',
  nmatrix_header_dir
]

dir_config(extension_name, HEADER_DIRS, LIB_DIRS)

have_library('af')
```
## NMatrix C++ API

An NMatrix Ruby C object is denoted by `cNMatrix`. Since, `cNMatrix` has been initially defined in `nmatrix.h` file
we represent it as extern `VALUE` and `C++` has been specified as we are using the `C++`interface.

Next, we create the Ruby bindings.

```c
extern "C++" {
  VALUE cNMatrix;
}

void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Af_Array = rb_define_class_under(ArrayFire, "Af_Array", rb_cObject);
  rb_define_method(Af_Array, "to_nmatrix", (METHOD)arf_af_array_to_nmatrix, 0);

  cNMatrix = rb_define_class("NMatrix", rb_cObject);
  rb_define_method(cNMatrix, "to_af_array", (METHOD)arf_nmatrix_to_af_array_method, 0);
}
```

The C functions have been implemented as the following code snippets.



`nm` namespace is used to store `NMatrix` `types` and `structs`.

# Af_Array to NMatrix

An `Af_Array#to_nmatrix` is called to convert an `Af_Array` object to `NMatrix` object. The `#to_nmatrix` method calls
`arf_af_array_to_nmatrix` method which is responsible for calling `NMatrix C++ APIs`.
The `rb_nmatrix_dense_create()` is NMatrix API to create a dense `NMatrix` object. `nm::FLOAT64` is the `dtype` of NMatrix.

```c
// ext/mri/interface/nmatrix.c

static VALUE arf_af_array_to_nmatrix(VALUE self) {
  afstruct* input;
  Data_Get_Struct(self, afstruct, input);
  dim_t count;
  uint ndims;
  af_get_numdims(&ndims, input->carray);

  dim_t* dims = (dim_t*)malloc(ndims * sizeof(dim_t));

  af_get_dims(&dims[0], &dims[1], &dims[2], &dims[3], input->carray);

  size_t* shape = (size_t*)malloc(ndims * sizeof(size_t));;
  for (dim_t index = 0; index < ndims; index++){
    shape[index] = (size_t)(dims[index]);
  }

  af_get_elements(&count, input->carray);

  double* elements = (double*)malloc(count * sizeof(double));
  af_get_data_ptr(elements, input->carray);

  return rb_nmatrix_dense_create(nm::FLOAT64, shape, ndims, elements, (int)count);
}
```
# NMatrix to Af_Array

An `NMatrix#to_af_array` is called to convert an `NMatrix` object to `Af_Array` object. The `#to_af_array` method calls
`arf_nmatrix_to_af_array_method` method which is responsible for calling `NMatrix C++ APIs`. `NM_DTYPE()` is used  to check
the dtype of an `NMatrix` object. Currentlt, only `nm::FLOAT64` is supported.

The `arf_nmatrix_to_af_array` is called by `arf_nmatrix_to_af_array_method` method and an `Af_Array` object.

```c
// ext/mri/interface/nmatrix.c

extern VALUE arf_nmatrix_to_af_array_method(VALUE nmatrix) {
  if (NM_DIM(nmatrix) > 4) {
    rb_raise(rb_eStandardError,
      "NMatrix must not have greater than 4 dimensions.");
  }

  if (NM_DTYPE(nmatrix) == nm::FLOAT64) {
    return Data_Wrap_Struct(Af_Array, NULL, arf_free, arf_nmatrix_to_af_array(nmatrix));
  }
  else {
    rb_raise(rb_eStandardError,
      "NMatrix should be either :complex64, :complex128, :int32 or :float64 type.");
  }
  return Qnil;
}


afstruct* arf_nmatrix_to_af_array(VALUE nm) {
  DENSE_STORAGE* nmat = NM_STORAGE_DENSE(nm);
  afstruct* output = ALLOC(afstruct);

  if (nmat->dtype != nm::FLOAT64) {
    rb_raise(rb_eStandardError, "requires dtype of :float64 to convert to an Af_Array");
  }

  dim_t* shape = (dim_t*)malloc(nmat->dim * sizeof(dim_t));;
  for (size_t index = 0; index < nmat->dim; index++){
    shape[index] = (size_t)(nmat->shape[index]);
  }

  af_create_array(&output->carray, nmat->elements, nmat->dim, shape, f64);

  return output;
}
```



Let's  pry it out.

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> require 'nmatrix'
=> true
[2] pry(main)> a = ArrayFire::Af_Array.new 2, [4,4], [1, 2, 2, 0,  -2, 2 , 1, 3, 1, 4, 3 , 1, 0, -3, 2, 9]
No Name Array
[4 4 1 1]
    1.0000    -2.0000     1.0000     0.0000
    2.0000     2.0000     4.0000    -3.0000
    2.0000     1.0000     3.0000     2.0000
    0.0000     3.0000     1.0000     9.0000

=> #<ArrayFire::Af_Array:0x000000019bd6f0>
[3] pry(main)> b = a.to_nmatrix
=>
[
  [ 1.0,  2.0, 2.0, 0.0]
  [-2.0,  2.0, 1.0, 3.0]
  [ 1.0,  4.0, 3.0, 1.0]
  [ 0.0, -3.0, 2.0, 9.0]
]

[4] pry(main)> c = b.to_af_array
=> #<ArrayFire::Af_Array:0x00000001a4d340>
[5] pry(main)> c.elements
=> [1.0, 2.0, 2.0, 0.0, -2.0, 2.0, 1.0, 3.0, 1.0, 4.0, 3.0, 1.0, 0.0, -3.0, 2.0, 9.0]
[6] pry(main)> ArrayFire::Util.print_array(c)
No Name Array
[4 4 1 1]
    1.0000    -2.0000     1.0000     0.0000
    2.0000     2.0000     4.0000    -3.0000
    2.0000     1.0000     3.0000     2.0000
    0.0000     3.0000     1.0000     9.0000

=> true
[7] pry(main)> ArrayFire::Util.print_array(c)
No Name Array
[4 4 1 1]
    1.0000    -2.0000     1.0000     0.0000
    2.0000     2.0000     4.0000    -3.0000
    2.0000     1.0000     3.0000     2.0000
    0.0000     3.0000     1.0000     9.0000

=> true
[8] pry(main)> c = b.to_af_array
=> #<ArrayFire::Af_Array:0x00000001436088>
```

It works!.

Hence, NMatrix and ArrayFire can be easily interfaced to each other.

# Benchmarks

Now, we can see how using ArrayFire can beneficial over using NMatrix. I benchmarked the matrix multiplication for
two matrices with same elements using [code](https://github.com/prasunanand/arrayfire-rb-benchmark-suite/blob/master/bin/interface.rb).

```ruby
shapeArray.each do |shape|
  elements1 = Array.new(shape[0]*shape[1]) { rand(1...999999) }
  elements2 = Array.new(shape[0]*shape[1]) { rand(1...999999) }
  cpu_matrix1 = NMatrix.new(shape, elements1, dtype: :float64)
  cpu_matrix2 = NMatrix.new(shape, elements2, dtype: :float64)

  gpu_matrix1 = cpu_matrix1.to_af_array
  gpu_matrix2 = cpu_matrix2.to_af_array

  iters.times do
    ArrayFire::BLAS.matmul(gpu_matrix1, gpu_matrix2, :AF_MAT_NONE, :AF_MAT_NONE) # warmup
  end

  result[:mat_mult_cpu] << [ shape[0]*shape[1], Benchmark.measure{cpu_matrix1.dot(cpu_matrix2)}.to_s.tr('()', '').split(" ")[3].to_f ]
  result[:mat_mult_gpu] << [ shape[0]*shape[1], Benchmark.measure{ArrayFire::BLAS.matmul(gpu_matrix1, gpu_matrix2, :AF_MAT_NONE, :AF_MAT_NONE)}.to_s.tr('()', '').split(" ")[3].to_f ]

end

```

<script type="text/javascript" src="https://code.jquery.com/jquery-2.2.4.min.js"   integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44="   crossorigin="anonymous"></script>

<script type="text/javascript" src="https://code.highcharts.com/highcharts.js"></script>
<script type="text/javascript" src="https://code.highcharts.com/4.2.2/modules/exporting.js"></script>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular.min.js"></script>

<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.1.1/normalize.min.css">

<div ng-app="resultApp">
    <div ng-controller="MainCtrl">
      <div class="block">
        <div id ="chart_interface" class="chart"></div>
      </div>
    </div>
  <script type="text/javascript" src="/assets/js/chart.js"></script>
</div>
(Note: The above benchmarks have been done on an AMD FX 8350 octacore processor
and Nvidia GTX 750Ti GPU. CUDA backend of ArrayFire was used with double floating points.)

As the matrix size increases, we can see the difference is huge.

Using ArrayFire can speed up the calculation by 7 e +5 times.

There may be overheads in copying data from CPU to GPU and vice-versa. But overall,
for large matrices(Big Data), we can gain massive speedups when we use the right optimization.
I would be discussing more about such optimizations in another blog post.

However, ArrayFire being significantly faster than NMatrix can easily help Rubyists by adding small
chunk of code and speeding up the critical/slower steps.

Power to Ruby!


{% if page.comments %}
<div id="disqus_thread"></div>
<script>
(function() { // DON'T EDIT BELOW THIS LINE
var d = document, s = d.createElement('script');

s.src = '//prasunanandblog.disqus.com/embed.js';

s.setAttribute('data-timestamp', +new Date());
(d.head || d.body).appendChild(s);
})();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
{% endif %}