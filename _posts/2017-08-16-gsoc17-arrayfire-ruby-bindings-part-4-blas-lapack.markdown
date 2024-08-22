---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part IV : BLAS and LAPACK routines)"
date:   2017-08-16 16:01:00 +0530
categories: arrayfire
comments: true
author: Prasun Anand
banner: /images/gsoc2017.png
---

This post covers how to use `BLAS` and `LAPACK` routines with `ArrayFire-rb`, and how these functions
have been implemented by creating Ruby bindings to ArrayFire C API.

The performance benchmarks for ArrayFire against NMatrix can be represented by the following figures.
The code used for benchmarking and generating the plots can be found [here](https://github.com/prasunanand/arrayfire-rb-benchmark-suite)
and be used to reproduce similar plots.

<script type="text/javascript" src="https://code.jquery.com/jquery-2.2.4.min.js"   integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44="   crossorigin="anonymous"></script>

<script type="text/javascript" src="https://code.highcharts.com/highcharts.js"></script>
<script type="text/javascript" src="https://code.highcharts.com/4.2.2/modules/exporting.js"></script>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular.min.js"></script>

<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.1.1/normalize.min.css">

# Performance metrics
<div ng-app="resultApp">
    <div ng-controller="MainCtrl">
      <div class="block">
        <strong>BLAS Routines</strong>
        <div id ="chartmat_mult" class="chart"></div>
      </div>
      <div class="block">
        <strong>LAPACK Routines</strong>
          <div id ="chartdeterminant" class="chart"></div><br>
          <div id ="chartlu_factorization" class="chart"></div><br>
      </div>
    </div>
  <script type="text/javascript" src="/assets/js/chart.js"></script>
</div>

(Note: The above benchmarks have been done on an AMD FX 8350 octacore processor
and Nvidia GTX 750Ti GPU. CUDA backend of ArrayFire was used with double floating points.)

The figure shows that ArrayFire takes the least computation time of all.
ArrayFire is 3 e +6 times faster than NMatrix for JRuby and NMatrix for Ruby(not BLAS)
whereas 7 e +5 times faster than NMatrix for Ruby(using BLAS).

For LAPACK routines, like calculating determinant and lower-upper factorization,
ArrayFire is 100 times faster than NMatrix for JRuby
whereas 6 times faster than NMatrix for Ruby(using LAPACKE).


Lets take a look at the implementation.

# BLAS Routines


All the BLAS methods are `singleton_methods`.

```c
void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Blas = rb_define_class_under(ArrayFire, "BLAS", rb_cObject);
  rb_define_singleton_method(Blas, "matmul", (METHOD)arf_matmul, 4);
  rb_define_singleton_method(Blas, "dot", (METHOD)arf_dot, 4);
  rb_define_singleton_method(Blas, "transpose", (METHOD)arf_transpose, 1);

}
```

`arf_matmul` and `arf_transpose` call `af_matmul` and `af_transpose` respectively.

```c

static VALUE arf_matmul(VALUE self, VALUE left_val, VALUE right_val, VALUE left_prop_val, VALUE right_prop_val){

  afstruct* left;
  afstruct* right;
  afstruct* result = ALLOC(afstruct);

  Data_Get_Struct(left_val, afstruct, left);
  Data_Get_Struct(right_val, afstruct, right);

  af_mat_prop left_mat_prop = arf_mat_type_from_rbsymbol(left_prop_val);
  af_mat_prop right_mat_prop = arf_mat_type_from_rbsymbol(right_prop_val);

  af_matmul(&result->carray, left->carray, right->carray, left_mat_prop, right_mat_prop);

  af_print_array(result->carray);

  return Data_Wrap_Struct(CLASS_OF(left_val), NULL, arf_free, result);
}

static VALUE arf_transpose(VALUE self, VALUE input){
  afstruct* obj;
  afstruct* result = ALLOC(afstruct);

  Data_Get_Struct(input, afstruct, obj);

  af_transpose(&result->carray, obj->carray, false);

  af_print_array(result->carray);

  return Data_Wrap_Struct(CLASS_OF(input), NULL, arf_free, result);
}

```

`af_matmul` expects the property of matrices passed to it. For example, `af_mat_prop AF_MAT_TRANS`
signifies that the matrix is transposed. So, to pass the symbols to Ruby C function arf_matmul, I
have used the code given below. I have creared a list of values `MAT_PROPERTIES` and a function
`arf_mat_type_from_symbol` which is responsible for figuring out `af_mat_prop` from the symbol.

```c

std::map<char*, size_t> MAT_PROPERTIES = {
  {"AF_MAT_NONE", 0},
  {"AF_MAT_TRANS", 1},
  {"AF_MAT_CTRANS", 2},
  {"AF_MAT_CONJ", 4},
  {"AF_MAT_UPPER", 32},
  {"AF_MAT_LOWER", 64},
  {"AF_MAT_DIAG_UNIT", 128},
  {"AF_MAT_SYM", 512},
  {"AF_MAT_POSDEF", 1024},
  {"AF_MAT_ORTHOG", 2048},
  {"AF_MAT_TRI_DIAG", 4096},
  {"AF_MAT_BLOCK_DIAG", 8192}
};


af_mat_prop arf_mat_type_from_rbsymbol(VALUE sym) {
  ID sym_id = SYM2ID(sym);

  for(std::map<char*, size_t>::value_type& entry : MAT_PROPERTIES) {
    if (sym_id == rb_intern(entry.first)) {
      return static_cast<af_mat_prop>(entry.second);
    }
  }

  VALUE str = rb_any_to_s(sym);
  rb_raise(rb_eArgError, "invalid matrix type symbol (:%s) specified",
   RSTRING_PTR(str));
}
```

So, now I can check if the bindings work successfully.

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> left = ArrayFire::Af_Array.new 2 , [3,3] , [1, 4, 6, 4, 11 , 2 ,-5, 8, 10]
No Name Array
[3 3 1 1]
    1.0000     4.0000    -5.0000
    4.0000    11.0000     8.0000
    6.0000     2.0000    10.0000

=> #<ArrayFire::Af_Array:0x000000014e56c8>
[2] pry(main)> right = ArrayFire::Af_Array.new 2 , [3,2] , [1, 0, 8, 10, -11, 8]
No Name Array
[3 2 1 1]
    1.0000    10.0000
    0.0000   -11.0000
    8.0000     8.0000

=> #<ArrayFire::Af_Array:0x00000001591db0>
[3] pry(main)> result = ArrayFire::BLAS.matmul(left, right, :AF_MAT_NONE, :AF_MAT_NONE)
No Name Array
[3 2 1 1]
  -39.0000   -74.0000
   68.0000   -17.0000
   86.0000   118.0000

=> #<ArrayFire::Af_Array:0x000000016136f8>
[4] pry(main)> transposed = ArrayFire::BLAS.transpose(left)
No Name Array
[3 3 1 1]
    1.0000     4.0000     6.0000
    4.0000    11.0000     2.0000
   -5.0000     8.0000    10.0000

=> #<ArrayFire::Af_Array:0x00000001762f68>

```
It works!.

# LAPACK Routines

LAPACK routines similar to BLAS ones are singleton methods.

```c
Lapack = rb_define_class_under(ArrayFire, "LAPACK", rb_cObject);
rb_define_singleton_method(Lapack, "svd_func", (METHOD)arf_svd_func, 4);
rb_define_singleton_method(Lapack, "svd_inplace_func", (METHOD)arf_svd_inplace_func, 1);
rb_define_singleton_method(Lapack, "lu_func", (METHOD)arf_lu_func, 4);
rb_define_singleton_method(Lapack, "lu_inplace_func", (METHOD)arf_lu_inplace_func, 1);
rb_define_singleton_method(Lapack, "qr_func", (METHOD)arf_qr_func, 4);
rb_define_singleton_method(Lapack, "qr_inplace_func", (METHOD)arf_qr_inplace_func, 1);
rb_define_singleton_method(Lapack, "cholesky_func", (METHOD)arf_cholesky_func, 3);
rb_define_singleton_method(Lapack, "cholesky_inplace_func", (METHOD)arf_cholesky_inplace_func, 1);
rb_define_singleton_method(Lapack, "solve_func", (METHOD)arf_solve_func, 0);
rb_define_singleton_method(Lapack, "solve_lu_func", (METHOD)arf_solve_lu_func, 0);
rb_define_singleton_method(Lapack, "inverse", (METHOD)arf_inverse, 1);
rb_define_singleton_method(Lapack, "rank", (METHOD)arf_rank, 1);
rb_define_singleton_method(Lapack, "det", (METHOD)arf_det, 1);
rb_define_singleton_method(Lapack, "norm", (METHOD)arf_norm, 1);
rb_define_singleton_method(Lapack, "is_lapack_available", (METHOD)arf_is_lapack_available, 0);
```

`LAPACK.svd` must return multiple objects and hence calls `LAPACK.arf_svd_func`. The implementation
is as follows.

```c

static VALUE arf_svd_func(VALUE self, VALUE u_val, VALUE s_val, VALUE vt_val, VALUE val){
  afstruct* input;
  afstruct* u;
  afstruct* s;
  afstruct* vt;

  Data_Get_Struct(val, afstruct, input);
  Data_Get_Struct(u_val, afstruct, u);
  Data_Get_Struct(s_val, afstruct, s);
  Data_Get_Struct(vt_val, afstruct, vt);

  af_svd(&u->carray, &s->carray, &vt->carray, input->carray);

  return Qtrue;
}

```

```ruby
module ArrayFire
  class LAPACK

    def self.svd(af_array)
      u =  ArrayFire::Af_Array.new
      s =  ArrayFire::Af_Array.new
      vt = ArrayFire::Af_Array.new
      ArrayFire::LAPACK.svd_func(u, s, vt, af_array)
      return u, s, vt
    end
  end
end
```

`LAPACK.det` calls `af_det` to calculate the determinant. Currently, I haven't
created support for complex dtype. So, I have ignored the imaginary part of
the result if it is not a real number.

```c

static VALUE arf_det(VALUE self, VALUE val){
  afstruct* matrix;
  double det_real, det_imag;

  Data_Get_Struct(val, afstruct, matrix);

  af_det(&det_real, &det_imag, matrix->carray);
  return DBL2NUM(det_real);
}


```

Now, we can check the elementwise operations using `pry`.

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> matrix = ArrayFire::Af_Array.new 2, [4,2], [1,3,5,7,2,4,6,8]
No Name Array
[4 2 1 1]
    1.0000     2.0000
    3.0000     4.0000
    5.0000     6.0000
    7.0000     8.0000

=> #<ArrayFire::Af_Array:0x0000000265cbe0>
[2] pry(main)> u , s, vt = ArrayFire::LAPACK.svd(matrix)
=> [#<ArrayFire::Af_Array:0x000000026ff070>, #<ArrayFire::Af_Array:0x000000026ff048>, #<ArrayFire::Af_Array:0x000000026ff020>]
[3] pry(main)> ArrayFire::Util.print_array(u)
No Name Array
[4 4 1 1]
   -0.1525    -0.8226    -0.3945    -0.3800
   -0.3499    -0.4214     0.2428     0.8007
   -0.5474    -0.0201     0.6979    -0.4614
   -0.7448     0.3812    -0.5462     0.0407

=> true
[4] pry(main)> ArrayFire::Util.print_array(s)
No Name Array
[2 1 1 1]
   14.2691
    0.6268

=> true
[5] pry(main)> ArrayFire::Util.print_array(vt)
No Name Array
[2 2 1 1]
   -0.6414    -0.7672
    0.7672    -0.6414

=> true
[6] pry(main)> left = ArrayFire::Af_Array.new 2 , [3,3] , [1, 4, 6, 4, 11 , 2 ,-5, 8, 10]
No Name Array
[3 3 1 1]
    1.0000     4.0000    -5.0000
    4.0000    11.0000     8.0000
    6.0000     2.0000    10.0000

=> #<ArrayFire::Af_Array:0x00000002984c78>
[7] pry(main)> det = ArrayFire::LAPACK.det(left)
=> 415.9999694824219

```

It works!

# Conclusion

We can now use `ArrayFire-rb` for linear algebra since the BLAS and LAPACK routines are in
place. Also, the performance is outstanding.

In the next blog, I will explain about using the Random Engine generator and Statistics methods for ArrayFire.

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
