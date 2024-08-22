---
layout: post
title:  "Calling D from Ruby for GPU computing"
date:   2017-07-25 10:01:00 +0530
categories: gpu-computing
comments: true
author: Prasun Anand
banner: /images/gsoc2017.png
---

Language bindings are interfaces that allow code written in one programming language to interact with or use functionalities provided by libraries or code written in another programming language. They serve as a bridge between different programming environments, making it possible for developers to leverage existing libraries or systems without needing to rewrite them in the language they are working in.


As [`ArrayFire-rb`](https://github.com/prasunanand/arrayfire-rb), a GPGPU libray has started taking shape,
the next goal is to interface it with [`NMatrix`](https://github.com/sciruby/nmatrix) library, so we can
run Linear Mixed Models([`mixed_models`](https://github.com/agisga/mixed_models/)).

I have also written an LMM(Linear Mixed Models) solver in D for Genome Wide Association studies
called [faster_lmm_d](https://github.com/prasunanand/faster_lmm_d) which has two GPU backends:
1. CUDA backend which helps it directly interact with CUBLAS libraries and runs only on Nvidia Hardware.
For CUDA backend, `Faster_LMM_D` uses [`cuda_d`](https://github.com/prasunanand/cuda_d)(The D bindings I wrote for CUDA libraries).

2. ArrayFire backend which helps it run on all major GPU vendors(Nvidia, Intel, AMD) by calling CUDA, CuBLAS,
OpenCL, clBLAS libraries using the ArrayFire library. For ArrayFire backend, `Faster_LMM_D` uses
[`arrayfire-d`](https://github.com/arrayfire/arrayfire-d)(The D bindings I wrote for ArrayFire library).

So, I found that it would be really great if we could port `faster_lmm_d` to Ruby by calling D from Ruby. `faster_lmm_d`
uses some cool tricks to efficiently use GPUs for computing like minimizing the warmup time, minimal copying
of CPU memory to GPU memory. It logs CPU memory and GPU memory before and after every significant computation.
So, it would be an ideal exercise for GPU computing on Ruby by calling D functions under the hood.

Although, this is still a work in progress, I would like to share about my experiences.

# Previous Attempts

There has been previous attempts at Calling D from Ruby. In my search for the existing attempts at
"Calling D from Ruby", I stumbled upon these resources.

1. [FFI](https://wiki.dlang.org/Call_D_from_Ruby_using_FFI): Use the Ruby-FFI gem to call a D function from C.
2. [RuDy](https://github.com/tomash/rudy): An effort / library / gem to enable
and ease writing Ruby native extensions in D programming language. It depends on creatind D bindings for the API calls in `ruby.h` header
file.
3. [Ruby-Dlang](https://github.com/llaine/ruby-dlang): Similar approach as Rudy.
4. [Orbit](https://github.com/jacob-carlborg/orbit): Similar approach as Rudy.

I have been intereseted in the first two methods, i.e. FFI and Rudy.

# Exploring FFI

The idea here is to create a shared object `.so` and call it with Ruby by loading the shared object using FFI gem.

Dlang has three compilers namely `DMD`, `GDC` and `LDC`. The post on Dlang wiki makes use of `DMD`, I could easily
run the example on my machine using `DMD`, however I could not run it with `LDC`. I need to compile the d files
with LDC because `faster_lmm_d` makes use of `LDC` compiler switches and it would take a lot of effort to be able to
run it with `DMD`.


The error I encountered is:

1. Error with ld :
```bash
$ ldc2 -shared -m64 -relocation-model=pic i.d
/usr/bin/ld: /home/prasun/ldclatest/ldc-1.1.0-pk9rkm4zvdp6pglam7s2/lib/libdruntime-ldc.a(errno.c.o): relocation R_X86_64_PC32 against undefined symbol `__errno_location@@GLIBC_2.2.5' can not be used when making a shared object; recompile with -fPIC
/usr/bin/ld: final link failed: Bad value
collect2: error: ld returned 1 exit status
Error: /usr/lib/nvidia-cuda-toolkit/bin/gcc failed with status: 1
```


I have also tried some hit and trial and yet I was unable to properly compile the file.


# Exploring RuDy

I find Rudy as a more suitable way to create Ruby native extensions.

When creating a Ruby native extension in C, we have a set of APIs provided by `ruby.h` that helps in creating a
`Module` or a `Class` and the `methods` are nested to it.

For example, `rb_define_module` helps in creating a module and `rb_define_class_under` is used to create a class
nested in a module. `rb_define_method` and `rb_define_singleton_method` are used to create methods. The variables
are used as `VALUE` which are passed around between Ruby frontend and C backend.

A simple code snippet.

```c
// calculater.c
void Init_extension() {
  Calculator = rb_define_module("Calculator");              // Calculator module
  IO = rb_define_class_under(Calculator, "IO", rb_cObject); // Calculator::IO class
  rb_define_alloc_func(IO, io_alloc);                       // memory allocator for C structs
  rb_define_method(IO, "initialize", io_init, -1);          // Calculator::IO#new constructor
  rb_define_method(IO, "get_stream",io_get_stream,1 );      // Calculator::IO#get_stream method
}

static VALUE io_init(int argc, VALUE* argv, VALUE self){
  // code...
  return self;
}

static VALUE io_get_stream(VALUE self, VALUE some_val){
  return Qtrue;
}

```

After the C code with the module, classes and methods are in place, we compile it to get a shared object `extension.so`. Then a Ruby
file `calculater.rb` can just load that `extension.so` as:

```ruby
# calculater.rb
require 'calculater.so'

```

This seems simple but as the size of application grows, the extension becomes tough to manage.


I believe D to be a superior C and provides modern programming paradigm and the LDC compiler is very promising. So, it would be great if we could write the
native extension in D and get a shared library. Also, LDC has an incredible garbage collecter that would be very helpful for scientific computing Ruby libraries.

To write the extension in D, the `ruby.h` bindings could be created in D using [`dstep`](http://www.dsource.org/projects/dstep) or [`bcd`](http://www.dsource.org/projects/bcd).

RuDy [doesn't have complete support](https://github.com/tomash/rudy#limitations-and-areas-for-development)
for `LDC` and I am still getting my head around using RuDy to create Ruby native extensions. [Here](http://tomash.wrug.eu/blog/2009/03/03/rudy-ruby-native-extensions-in-d-programming-language/) is a nice blog post about RuDy project.

# Conclusion

Calling D from Ruby would for sure prove to be an efficient way of writing Ruby native extensions and use D as a
better choice over C. In the meanwhile, porting faster-lmm-d is a work in progress and I will share further updates
when it is ready.

The progress of Ruby port of `faster-lmm-d` can be tracked at [`Bio-faster_lmm_d`](https://github.com/prasunanand/bio-faster_lmm_d)
and would become a part of [BioRuby](http://bioruby.org/) project. The latest progress can be tracked here.

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
