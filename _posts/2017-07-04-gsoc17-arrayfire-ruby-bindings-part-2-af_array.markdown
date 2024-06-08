---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part II : Af_Array)"
date:   2017-07-04 12:15:00 +0530
categories: arrayfire
comments: true
author: Prasun Anand
banner: /images/banner.png
---

This post covers how to create arrays using `arrayfire-rb`, perform elementwise
operations like addition, multiplication, etc. and how these functions have been
implemented by creating Ruby bindings to ArrayFire C API.

ArrayFire for Ruby stores arrays upto 4 dimension in the `Af_Array` class.

The speedup achieved is outstanding.

<script type="text/javascript" src="https://code.jquery.com/jquery-2.2.4.min.js"   integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44="   crossorigin="anonymous"></script>

<script type="text/javascript" src="https://code.highcharts.com/highcharts.js"></script>
<script type="text/javascript" src="https://code.highcharts.com/4.2.2/modules/exporting.js"></script>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular.min.js"></script>

<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.1.1/normalize.min.css">

# Performance metrics
<div ng-app="resultApp">
    <div ng-controller="MainCtrl">
      <div class="block">
        <strong>Arithmetic Operations</strong>
        <div id ="chartaddition" class="chart"></div>
        <div id ="chartsubtraction" class="chart"></div>
      </div>
    </div>
  <script type="text/javascript" src="/assets/js/chart.js"></script>
</div>

(Note: The above benchmarks have been done on an AMD FX 8350 octacore processor
and Nvidia GTX 750Ti GPU.)

The figure shows that ArrayFire takes the least computation time of all.
For elementwise arithmetic operations,  ArrayFire is 2 e 4 times faster than NMatrix for Ruby whereas
2 e 3 times faster than NMatrix for JRuby.

The performance benchmarks for ArrayFire against NMatrix can be represented by the following figures.
The code used for benchmarking and generating the plots can be found [here](https://github.com/prasunanand/arrayfire-rb-benchmark-suite)
and be used to reproduce similar plots.

Lets take a look at the implementation.

# Initialization

An `Af_Array` expects the number of dimensions( `ndims` ), size of array along each
dimension(`dimension`) and the elements(`elements`).

Af_Array class is created under the ArrayFire module using `rb_define_class_under()`.
Next, I have added `arf_alloc` function using `rb_define_alloc_func` that allocates
memory  to `Af_Array` and is run everytime `Af_Array#new` is called. `arf_alloc` works
along with `arf_init` that accepts parameters from Ruby call and calls C to create
an `af_array`. ArrayFire C apis use `af_array` pointer to store an array.

The methods for elemetwise operations have also been implemented using `rb_define_method`.

```c
void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Af_Array = rb_define_class_under(ArrayFire, "Af_Array", rb_cObject);
  rb_define_alloc_func(Af_Array, arf_alloc);
  rb_define_method(Af_Array, "initialize", (METHOD)arf_init, -1);

  rb_define_method(Af_Array, "+",(METHOD)arf_ew_add,1);
  rb_define_method(Af_Array, "-",(METHOD)arf_ew_subtract,1);
  rb_define_method(Af_Array, "*",(METHOD)arf_ew_multiply,1);
  rb_define_method(Af_Array, "/",(METHOD)arf_ew_divide,1);

}
```

To store an `Af_Array`, I have create an afstruct that stores the `af_array` pointer.
`arf_init(int argc, VALUE* argv, VALUE self)` can take any number of arguments and self
is used to bind the `afstruct` to an `Af_Array` object.

The Ruby C APIs uses `VALUE` to pass around pointers. I have casted all the `VALUE` types
to the C types expected by ArrayFire C API. `NUM2LONG` and `NUM2DBL` have been used to
convert the VALUE to `long` and `double` respectively.

Once, I have the ndims, dimensions and elements, I can use `af_create_array` to create an
array. `afstruct->carray` points to the array and the array can be accessed anytime by
using this pointer.

The point to note here is that all the data is on GPU now and hence, the time and resources
for copying data from GPU to CPU is taken care of. It may not be clear now but it will be
pivotal in the blogs to come when I interface `mixed_models` with arrayfire.

```c

typedef struct AF_STRUCT
{
  af_array carray;
}afstruct;

VALUE arf_init(int argc, VALUE* argv, VALUE self)
{
  afstruct* afarray;
  Data_Get_Struct(self, afstruct, afarray);
  dim_t ndims = (dim_t)NUM2LONG(argv[0]);
  dim_t* dimensions = (dim_t*)malloc(ndims * sizeof(dim_t));
  dim_t count = 1;
  for (size_t index = 0; index < ndims; index++) {
    dimensions[index] = (dim_t)NUM2LONG(RARRAY_AREF(argv[1], index));
    count *= dimensions[index];
  }
  float* host_array = (float*)malloc(count * sizeof(float));
  for (size_t index = 0; index < count; index++) {
    host_array[index] = (float)NUM2DBL(RARRAY_AREF(argv[2], index));
  }

  af_create_array(&afarray->carray, host_array, ndims, dimensions, f32);

  af_print_array(afarray->carray);

  return self;
}


static VALUE arf_alloc(VALUE klass)
{
  /* allocate */
  afstruct* af = ALLOC(afstruct);
  /* wrap */
  return Data_Wrap_Struct(klass, NULL, arf_free, af);
}


```

So, now I can check if the bindings work successfully.

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> a = ArrayFire::Af_Array.new 2, [2,2],[1,2,3,4]
No Name Array
[2 2 1 1]
   Offsets: [0 0 0 0]
   Strides: [1 2 4 4]
    1.0000     3.0000
    2.0000     4.0000

=> #<ArrayFire::Af_Array:0x000000020aeab8>
[2] pry(main)>

```
(Note: ArrayFire stores array in column-major format.)

Voila! It works.


# Elementwise operations

The following code snippets show how I implemented elemetwise operations like
`addition`, `subtraction`, `multiplication` and `division`.

I have created macros `DEF_ELEMENTWISE_RUBY_ACCESSOR` and  `DECL_ELEMENTWISE_RUBY_ACCESSOR`that
define and declare the functions. The function names call the corresponding
ArrayFire API.

e.g. `Af_Array#+` calls `arf_ew_add` which is responsible for calling `af_add`.

```c

#define DEF_ELEMENTWISE_RUBY_ACCESSOR(name, oper)                          \
static VALUE arf_ew_##name(VALUE left_val, VALUE right_val) {              \
  afstruct* left;                                                          \
  afstruct* right;                                                         \
  afstruct* result = ALLOC(afstruct);                                      \
  Data_Get_Struct(left_val, afstruct, left);                               \
  Data_Get_Struct(right_val, afstruct, right);                             \
  af_##oper(&result->carray,  left->carray, right->carray, true);          \
  af_print_array(result->carray);                                          \
  return Data_Wrap_Struct(CLASS_OF(left_val), NULL, arf_free, result);     \
}


#define DECL_ELEMENTWISE_RUBY_ACCESSOR(name)                               \
static VALUE arf_ew_##name(VALUE left_val, VALUE right_val);

DECL_ELEMENTWISE_RUBY_ACCESSOR(add)
DECL_ELEMENTWISE_RUBY_ACCESSOR(subtract)
DECL_ELEMENTWISE_RUBY_ACCESSOR(multiply)
DECL_ELEMENTWISE_RUBY_ACCESSOR(divide)

DEF_ELEMENTWISE_RUBY_ACCESSOR(add, add)
DEF_ELEMENTWISE_RUBY_ACCESSOR(subtract, sub)
DEF_ELEMENTWISE_RUBY_ACCESSOR(multiply, mul)
DEF_ELEMENTWISE_RUBY_ACCESSOR(divide, div)

```

Now, we can check the elementwise operations using `pry`.

```ruby

$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> a = ArrayFire::Af_Array.new 2, [2,2],[1,2,3,4]
No Name Array
[2 2 1 1]
   Offsets: [0 0 0 0]
   Strides: [1 2 4 4]
    1.0000     3.0000
    2.0000     4.0000

=> #<ArrayFire::Af_Array:0x000000020a3e38>
[2] pry(main)> b = a + a
No Name Array
[2 2 1 1]
   Offsets: [0 0 0 0]
   Strides: [1 2 4 4]
    2.0000     6.0000
    4.0000     8.0000

=> #<ArrayFire::Af_Array:0x000000020625c8>
[3] pry(main)> b = a * a
No Name Array
[2 2 1 1]
   Offsets: [0 0 0 0]
   Strides: [1 2 4 4]
    1.0000     9.0000
    4.0000    16.0000

=> #<ArrayFire::Af_Array:0x00000001fe6f90>

```
It works!

Lets check it for 4 dimensional matrices

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> a = ArrayFire::Af_Array.new 4, [2,2,2,2], [1,2,3,4,
                                                          5,6,7,8,
                                                          9,10,11,12,
                                                          13,14,15,16]
No Name Array
[2 2 2 2]
   Offsets: [0 0 0 0]
   Strides: [1 2 4 8]
    1.0000     3.0000
    2.0000     4.0000

    5.0000     7.0000
    6.0000     8.0000


    9.0000    11.0000
   10.0000    12.0000

   13.0000    15.0000
   14.0000    16.0000



=> #<ArrayFire::Af_Array:0x000000016c7a40>
[2] pry(main)> b = a + a
No Name Array
[2 2 2 2]
   Offsets: [0 0 0 0]
   Strides: [1 2 4 8]
    2.0000     6.0000
    4.0000     8.0000

   10.0000    14.0000
   12.0000    16.0000


   18.0000    22.0000
   20.0000    24.0000

   26.0000    30.0000
   28.0000    32.0000



=> #<ArrayFire::Af_Array:0x00000001686f18>
```

Hence, Af_Array can successfully handle arrays upto 4 dimesnions.

# Conclusion

ArrayFire for Ruby can successfully create arrays on GPU using `Af_Array` class and supports
elementwise binary operations. Similarly, I have implemented elementwise unary operations like `Af_Array#sin`
`Af_Array#erfc`.

In the next blog post, I will explain about the test-suite and Algorithm class.

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