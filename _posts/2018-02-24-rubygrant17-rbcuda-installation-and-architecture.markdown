---
layout: post
title:  "RbCUDA: Installation and Architecture"
date:   2018-02-24 12:10:41 +0530
categories: cuda opencl ruby rbcuda
comments: true
---

This post explains the architecture of `RbCUDA` and how you can install it on your machine.

# Installation

Install `CUDA` on your machine.

### Building `RbCUDA` from source.

```sh
git clone https://github.com/prasunanand/rbcuda
cd rbcuda
bundle install
rake compile
```

### Installing the gem

```sh
gem build rbcuda.gemspec
gem install rbcuda-0.0.0.gem
```

To check if installation was successful, run pry.

```ruby
$ rake pry
pry -r './lib/rbcuda.rb'
[1] pry(main)> RbCUDA::CUDA.cuInit(0);
[2] pry(main)> device = RbCUDA::CUDA.cuDeviceGet(0);
[3] pry(main)> puts device
#<RbCUDA::RbCuDevice:0x00000001a9a2d0>
=> nil
[4] pry(main)> puts RbCUDA::CUDA.cuDeviceGetName(100, device);
GeForce GTX 750 Ti
```
If you are successfully able to retrive the name of GPU card, you are all set.


# Code organisation

`extconf.rb` that helps in building the shared object file can be found [here](https://github.com/prasunanand/rbcuda/blob/master/ext/rbcuda/extconf.rb).


`rbcuda.h` defines all the Ruby structs that correspond to CUDA types. In the following code `CUfunction` type can be represented as `function_ptr`.


```ruby
typedef struct FUNCTION_PTR
{
  CUfunction function;
}function_ptr;

typedef struct DEVICE_PTR
{
  CUdevice device;
}device_ptr;

```
The struct `fuction_ptr` is then wrapped by a Ruby object called `RbCuFunction` in the file `ruby_rbcuda.c`.

```ruby
RbCUDA = rb_define_module("RbCUDA");

VALUE RbCuDevice = Qnil;
VALUE RbCuFunction = Qnil;

RbCuDevice    = rb_define_class_under(RbCUDA, "RbCuDevice",    rb_cObject);
RbCuFunction  = rb_define_class_under(RbCUDA, "RbCuFunction",  rb_cObject);

```

# Dev Array

An array in RbCUDA is handled using Dev_Array class. Implementation is as follows:

```
typedef struct DEV_PTR
{
  double* carray;
}dev_ptr;

Dev_Array = rb_define_class_under(RbCUDA, "Dev_Array", rb_cObject);

```
A Dev Array stores the pointer to the array data stored on the GPU. The usage will be explained in the next blog.

# Functionalities

RbCUDA has the following modules:
1. CUDA : It consists of low-level APIs called the CUDA driver APIs.
2. Runtime : It consists of higher-level APIs called the CUDA runtime APIs that are implemented on top of the CUDA driver APIs.
3. CuBLAS : It consists of BLAS APIs provided by cuBLAS library.
4. CuSolver : It consists of APIs provided by cuSolver library.
5. CuRand : It consists APIs provided by cuRand library.
6. Profiler : It consists of APIs for profiling CUDA code.

# Conclusion

I have explained how the underlying architecture looks like.

We have got `RbCUDA` successfully installed on our system. In the next blog I will talk about implementing Runtime APIs.



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
