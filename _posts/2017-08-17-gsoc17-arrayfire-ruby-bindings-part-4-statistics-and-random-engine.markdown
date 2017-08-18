---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part V : Statistics and Randome Engine routines)"
date:   2017-08-17 14:00:00 +0530
categories: arrayfire
comments: true
---

This post explains about the `Statistics` and `Random` class of `arrayfire` gem.
`ArrayFire::Statistics` class consists of  methods that can be used to operate on `Af_Array` for statistical analysis. `ArrayFire::Random` class contains of methods to generate Random numbers and array of Random numbers
on the GPU.

# Statistics Class

The `Statistics` class contains of singleton methods like `mean`, `var`, `median`, `stddev`, etc.
Let us take a look at the implementation.

```c
void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Statistics = rb_define_class_under(ArrayFire, "Statistics", rb_cObject);
  rb_define_singleton_method(Statistics, "mean", (METHOD)arf_mean, 2);
  rb_define_singleton_method(Statistics, "mean_weighted", (METHOD)arf_mean_weighted, 3);
  rb_define_singleton_method(Statistics, "var", (METHOD)arf_var, 3);
  rb_define_singleton_method(Statistics, "var_weighted", (METHOD)arf_var_weighted, 3);
  rb_define_singleton_method(Statistics, "stdev", (METHOD)arf_stdev, 2);
  rb_define_singleton_method(Statistics, "cov", (METHOD)arf_cov, 3);
  rb_define_singleton_method(Statistics, "median", (METHOD)arf_median, 2);
  rb_define_singleton_method(Statistics, "mean_all", (METHOD)arf_mean_all, 1);
  rb_define_singleton_method(Statistics, "mean_all_weighted", (METHOD)arf_mean_all_weighted, 2);
  rb_define_singleton_method(Statistics, "var_all", (METHOD)arf_var_all, 2);
  rb_define_singleton_method(Statistics, "var_all_weighted", (METHOD)arf_var_all_weighted, 2);
  rb_define_singleton_method(Statistics, "stdev_all", (METHOD)arf_stdev_all, 1);
  rb_define_singleton_method(Statistics, "median_all", (METHOD)arf_median_all, 1);
  rb_define_singleton_method(Statistics, "corrcoef", (METHOD)arf_corrcoef, 2);

}
```

`ArrayFire` provides four different methods to calculate the means namely,
`mean`, `mean_weighted`, `mean_all`, `mean_all_weighted`. The implementation
is given below.

`mean` and `mean_weighted` calculate the mean and weighted mean along the dimnension
specified. However, `mean_all` and `mean_weighted_all` calculate the mean and weighted
mean over all the elements in an array.

```c

static VALUE arf_mean(VALUE self, VALUE array_val, VALUE dim_val){
  afstruct* input;
  afstruct* output = ALLOC(afstruct);

  Data_Get_Struct(array_val, afstruct, input);

  af_mean(&output->carray, input->carray, NUM2UINT(dim_val));
  af_print_array(output->carray);

  return Data_Wrap_Struct(Af_Array, NULL, arf_free, output);
}

static VALUE arf_mean_weighted(VALUE self, VALUE array_val, VALUE weighted_array_val, VALUE dim_val){
  afstruct* input;
  afstruct* weighted_array;
  afstruct* output = ALLOC(afstruct);

  Data_Get_Struct(array_val, afstruct, input);
  Data_Get_Struct(weighted_array_val, afstruct, weighted_array);

  af_mean_weighted(&output->carray, input->carray, weighted_array->carray, NUM2UINT(dim_val));
  af_print_array(output->carray);

  return Data_Wrap_Struct(Af_Array, NULL, arf_free, output);
}

static VALUE arf_mean_all(VALUE self, VALUE array_val){
  afstruct* input;
  double real_part, imag_part;

  Data_Get_Struct(array_val, afstruct, input);

  af_mean_all(&real_part, &imag_part, input->carray);

  return DBL2NUM(real_part);
}

static VALUE arf_mean_all_weighted(VALUE self, VALUE array_val, VALUE weighted_array_val){
  afstruct* input;
  afstruct* weighted_array;
  double real_part, imag_part;

  Data_Get_Struct(array_val, afstruct, input);
  Data_Get_Struct(weighted_array_val, afstruct, weighted_array);

  af_mean_all_weighted(&real_part, &imag_part, input->carray, weighted_array->carray);

  return DBL2NUM(real_part);
}

```
I check the bindings using `pry`.

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> arr = ArrayFire::Random.randu(2, [4, 4])=> #<ArrayFire::Af_Array:0x0000000308fb08>
[2] pry(main)> ArrayFire::Util.print_array(arr)No Name Array
[4 4 1 1]
    0.3990     0.7353     0.9455     0.7089
    0.6720     0.5160     0.1587     0.9434
    0.5339     0.3932     0.8831     0.1227
    0.1386     0.2706     0.0621     0.9107

=> true
[3] pry(main)> weighted_array = ArrayFire::Af_Array.new 2, [4,4], [1, 2, 2, 0,  -2, 2 , 1, 3, 1, 4, 3 , 1, 0, -3, 2, 9]
No Name Array
[4 4 1 1]
    1.0000    -2.0000     1.0000     0.0000
    2.0000     2.0000     4.0000    -3.0000
    2.0000     1.0000     3.0000     2.0000
    0.0000     3.0000     1.0000     9.0000

=> #<ArrayFire::Af_Array:0x0000000316c008>
[4] pry(main)> mean = ArrayFire::Statistics.mean(arr, 1)
No Name Array
[4 1 1 1]
    0.6972
    0.5725
    0.4832
    0.3455

=> #<ArrayFire::Af_Array:0x00000003212138>
[5] pry(main)> mean_weighted = ArrayFire::Statistics.mean_weighted(arr, weighted_array, 2)
No Name Array
[4 4 1 1]
    0.3990     0.7353     0.9455        nan
    0.6720     0.5160     0.1587     0.9434
    0.5339     0.3932     0.8831     0.1227
       nan     0.2706     0.0621     0.9107

=> #<ArrayFire::Af_Array:0x000000031d2588>
[6] pry(main)> mean_all = ArrayFire::Statistics.mean_all(arr)=> 0.5246008634567261
[7] pry(main)> mean_all_weighted = ArrayFire::Statistics.mean_all_weighted(arr, weighted_array)
=> 0.5184718370437622
```

# Random Class

ArrayFire supports three types of random engines: `:AF_RANDOM_ENGINE_PHILOX_4X32_10`,
`:AF_RANDOM_ENGINE_THREEFRY_2X32_16` and `:AF_RANDOM_ENGINE_MERSENNE_GP11213` which can be
passed as a type.

The default randon engine is `:AF_RANDOM_ENGINE_PHILOX_4X32_10`. Random class helps  in creating
an engine by specifying the type and seed. A programmer can set the seed on the fly and also create
arrays with randomly generated values.

```c
void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Random = rb_define_class_under(ArrayFire, "Random", rb_cObject);
  rb_define_alloc_func(Random, arf_engine_alloc);
  rb_define_singleton_method(Random, "create_random_engine", (METHOD)arf_create_random_engine, 2);
  rb_define_singleton_method(Random, "retain_random_engine", (METHOD)arf_retain_random_engine, 1);
  rb_define_singleton_method(Random, "random_engine_set_type", (METHOD)arf_random_engine_set_type, 0);
  rb_define_singleton_method(Random, "random_engine_get_type", (METHOD)arf_random_engine_get_type, 0);
  rb_define_singleton_method(Random, "random_uniform", (METHOD)arf_random_uniform, 3);
  rb_define_singleton_method(Random, "random_normal", (METHOD)arf_random_normal, 3);
  rb_define_singleton_method(Random, "random_engine_set_seed", (METHOD)arf_random_engine_set_seed, 2);
  rb_define_singleton_method(Random, "get_default_random_engine", (METHOD)arf_get_default_random_engine, 0);
  rb_define_singleton_method(Random, "set_default_random_engine_type", (METHOD)arf_set_default_random_engine_type, 0);
  rb_define_singleton_method(Random, "random_engine_get_seed", (METHOD)arf_random_engine_get_seed, 0);
  rb_define_singleton_method(Random, "release_random_engine", (METHOD)arf_release_random_engine, 0);
  rb_define_singleton_method(Random, "randu", (METHOD)arf_randu, 2);
  rb_define_singleton_method(Random, "randn", (METHOD)arf_randn, 2);
  rb_define_singleton_method(Random, "set_seed", (METHOD)arf_set_seed, 1);
  rb_define_singleton_method(Random, "get_seed", (METHOD)arf_get_seed, 0);
}
```

A Random enigne must be created so I write the ruby bindings to alloc memory
and dealloc memory to a `af_random_engine` using `arf_engine_alloc` and `arf_engine_free`
respectively. The rest is similar to how I created bindings in previous blog posts.

```c

typedef struct RANDOM_ENGINE_STRUCT
{
  af_random_engine cengine;
}afrandomenginestruct;

static VALUE arf_engine_alloc(VALUE klass)
{
  /* allocate */
  afrandomenginestruct* afrandomengine = ALLOC(afrandomenginestruct);
  /* wrap */
  return Data_Wrap_Struct(klass, NULL, arf_engine_free, afrandomengine);
}

static void arf_engine_free(afrandomenginestruct* afrandomengine)
{
  free(afrandomengine);
}

static VALUE arf_create_random_engine(VALUE self, VALUE type_val, VALUE seed_val){
  afrandomenginestruct* output = ALLOC(afrandomenginestruct);
  af_random_engine_type rtype = arf_randome_engine_type_from_rbsymbol(type_val);

  af_create_random_engine(&output->cengine, AF_RANDOM_ENGINE_DEFAULT, NUM2ULL(seed_val) ) ;

  return Data_Wrap_Struct(Random, NULL, arf_engine_free, output);
}

static VALUE arf_randu(VALUE self, VALUE ndims_val, VALUE dim_val){
  afstruct* out_array = ALLOC(afstruct);

  dim_t ndims = (dim_t)FIX2LONG(ndims_val);
  dim_t* dimensions = (dim_t*)malloc(ndims * sizeof(dim_t));
  dim_t count = 1;
  for (dim_t index = 0; index < ndims; index++) {
    dimensions[index] = (dim_t)FIX2LONG(RARRAY_AREF(dim_val, index));
    count *= dimensions[index];
  }
  af_randu(&out_array->carray, ndims, dimensions,f64);
  return Data_Wrap_Struct(Af_Array, NULL, arf_free, out_array);
}
```


Now, we have the bindings ready, we can check it using `pry`.

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> engine = ArrayFire::Random.create_random_engine(:AF_RANDOM_ENGINE_PHILOX_4X32_10, 100)
=> #<ArrayFire::Random:0x00000002a41350>
[2] pry(main)> ArrayFire::Random.random_engine_get_seed(engine)
=> 100
[3] pry(main)> ArrayFire::Random.random_engine_set_seed(engine, 123)
=> #<ArrayFire::Random:0x00000002cfbd98>
[4] pry(main)> ArrayFire::Random.random_engine_get_seed(engine)
=> 123
[5] pry(main)> ArrayFire::Random.random_engine_get_type engine
=> "AF_RANDOM_ENGINE_PHILOX_4X32_10"
[6] pry(main)> arr = ArrayFire::Random.randu(2, [4, 4])
=> #<ArrayFire::Af_Array:0x00000002b185f8>
[7] pry(main)> ArrayFire::Util.print_array(arr)
No Name Array
[4 4 1 1]
    0.3990     0.7353     0.9455     0.7089
    0.6720     0.5160     0.1587     0.9434
    0.5339     0.3932     0.8831     0.1227
    0.1386     0.2706     0.0621     0.9107

=> true
[8] pry(main)> arr2 = ArrayFire::Random.randn(2, [4, 4])
=> #<ArrayFire::Af_Array:0x000000029fd4c0>
[9] pry(main)> ArrayFire::Util.print_array(arr2)
No Name Array
[4 4 1 1]
    0.2985    -0.8873    -1.0309     0.5312
   -2.7126    -0.3550    -1.4627    -1.7783
    0.4584     1.9841     0.0075    -0.5459
    1.5579    -0.9308    -1.0512     0.4640

=> true
```

we have the `Random` support ready for `ArrayFire-rb`



Hence, Ruby bindings for Statistics and Random methods have been successfully implemented.

# Conclusion

We can now use `ArrayFire-rb` for statistical analysis on data. Since, the calculations would be
on GPU, we can feed it large amount of data from real world.

Random engine can help in creating large arrays with randomly generated values in seconds.

In the next blog, I will explain about using multiple backends using `ArrayFire` , i.e. OpenCL, CUDA
and even use CPUs.

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