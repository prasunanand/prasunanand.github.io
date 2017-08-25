---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part VII : Multiple Backends: CUDA, OpenCL and CPU)"
date:   2017-08-24 14:00:00 +0530
categories: arrayfire
comments: true
---

ArrayFire can run not just on GPU devices but also on CPU devices, which is one of its really cool features.
With version `3.2` the `unified-backend` helps in changing the ArrayFire backend on the fly.
When using the unified-backend, the preference order for the default backend is CUDA > OpenCL > CPU.

The CPU backend requires `Intel MKL libraries` be installed. To install Intel MKL library, go to the official
download [link](https://software.intel.com/en-us/mkl). Next extract the file and run `sudo install.sh` from the
project root directory.

For an AMD CPU, you need to specify the location of `libmkl_rt.so`.

To solve this on a debian machine:

```sh
$ cd /etc/ld.so.conf.d/
$ sudo nano mylibs.conf
```

Paste line:
```sh
/opt/intel/compilers_and_libraries_2017/linux/mkl/lib/intel64_lin/
```

Next, run

```
$ sudo ldconfig
```

Now download arrayfire-rb from [link]("https://github.com/prasunanand/arrayfire-rb")

```ruby
$ git clone https://github.com/prasunanand/arrayfire-rb
$ rake compile
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> ArrayFire::Backend.get_backend_count
=> 3
[2] pry(main)> ArrayFire::Backend.get_active_backend
=> "AF_BACKEND_CUDA"
[3] pry(main)> ArrayFire::Backend.set_backend(:AF_BACKEND_CPU)
=> nil
[4] pry(main)> ArrayFire::Backend.get_active_backend
=> "AF_BACKEND_CPU"
```

Voila! You can run ArrayFire on CPU.

Lets look into the implementation and what else can we do.

# Backend

The class structure of Backend class is as follows:
```c

void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Backend = rb_define_class_under(ArrayFire, "Backend", rb_cObject);
  rb_define_singleton_method(Backend, "get_backend_count", (METHOD)arf_get_backend_count, 0);
  rb_define_singleton_method(Backend, "get_available_backends", (METHOD)arf_get_available_backends, 0);
  rb_define_singleton_method(Backend, "get_backend_id", (METHOD)arf_get_backend_id, 1);
  rb_define_singleton_method(Backend, "get_active_backend", (METHOD)arf_get_active_backend, 0);
  rb_define_singleton_method(Backend, "get_device_id", (METHOD)arf_get_backend_device_id, 1);
  rb_define_singleton_method(Backend, "set_backend", (METHOD)arf_set_backend, 1);
}
```

The C bindings were implemented as:

```c
static VALUE arf_get_backend_count(VALUE self){
  uint num_backends;
  af_get_backend_count(&num_backends);
  return UINT2NUM(num_backends);
}

static VALUE arf_get_available_backends(VALUE self){
  int backends;
  af_get_available_backends(&backends);
  return INT2NUM(backends);
}

static VALUE arf_get_backend_id(VALUE self, VALUE array_val){
  afstruct* input;
  Data_Get_Struct(array_val, afstruct, input);
  af_backend backend;
  af_get_backend_id (&backend, input->carray);

  const char* backend_name = get_backend_name(backend);
  return rb_str_new_cstr(backend_name);
}

static VALUE arf_get_active_backend(VALUE self){
  af_backend backend;
  af_get_active_backend(&backend);
  const char* backend_name = get_backend_name(backend);
  return rb_str_new_cstr(backend_name);
}

static VALUE arf_set_backend(VALUE self, VALUE backend_val){
  af_backend backend = arf_backend_type_from_rbsymbol(backend_val);
  af_set_backend(backend);
  return Qnil;
}
```


An `af_backend`  symbol can be `:AF_BACKEND_DEFAULT`, `:AF_BACKEND_CPU`, `:AF_BACKEND_CUDA`, or `:AF_BACKEND_OPENCL`.
The implemetation is given below.

```c
std::map<char*, size_t> BACKEND_TYPES = {
  {"AF_BACKEND_DEFAULT" , 0},                        ///< Default backend order: OpenCL -> CUDA -> CPU
  {"AF_BACKEND_CPU"     , 1},                        ///< CPU a.k.a sequential algorithms
  {"AF_BACKEND_CUDA"    , 2},                        ///< CUDA Compute Backend
  {"AF_BACKEND_OPENCL"  , 4}                         ///< OpenCL Compute Backend
};

af_backend arf_backend_type_from_rbsymbol(VALUE sym) {
  ID sym_id = SYM2ID(sym);

  for(std::map<char*, size_t>::value_type& entry : BACKEND_TYPES) {
    if (sym_id == rb_intern(entry.first)) {
      return static_cast<af_backend>(entry.second);
    }
  }

  VALUE str = rb_any_to_s(sym);
  rb_raise(rb_eArgError, "invalid backend type symbol (:%s) specified", RSTRING_PTR(str));
}
```

`ArrayFire::Backend.get_available_backends` lets you know the backends available.
This is the table that helps you decipher the backends available.

|Value      |Backends|
|----------------|:----------------------------------------|
|0  | None|
|1  | CPU|
|2  | CUDA|
|3  | CPU and CUDA|
|4  | OpenCL|
|5  | CPU and OpenCL|
|6  | CUDA and OpenCL|
|7  | CPU, CUDA and OpenCL|


Using `rake pry` to investigate the backend and device available for computing:

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> backends = ArrayFire::Backend.get_available_backends
=> 7
[2] pry(main)> ArrayFire::Backend.get_backend_count
=> 3
[3] pry(main)> ArrayFire::Backend.get_active_backend
=> "AF_BACKEND_CUDA"
[4] pry(main)> ArrayFire::Device.info
ArrayFire v3.4.0 (CUDA, 64-bit Linux, build 75cad40)
Platform: CUDA Toolkit 7.5, Driver: 375.66
[0] GeForce GTX 750 Ti, 4042 MB, CUDA Compute 5.0
=> nil
[5] pry(main)> ArrayFire::Backend.set_backend(:AF_BACKEND_CPU)
=> nil
[6] pry(main)> ArrayFire::Device.info
ArrayFire v3.4.0 (CPU, 64-bit Linux, build 75cad40)
[0] AMD: AMD FX(tm)-8350 Eight-Core Processor           , 16077 MB, Max threads(8)
=> nil
[7] pry(main)> ArrayFire::Backend.set_backend(:AF_BACKEND_OPENCL)
=> nil
[8] pry(main)> ArrayFire::Device.info
ArrayFire v3.4.0 (OpenCL, 64-bit Linux, build 75cad40)
[0] NVIDIA  : GeForce GTX 750 Ti, 4041 MB

```


ArrayFire also helps in interacting custom `OpenCL` and `CUDA` kernels. Since, Ruby currently
doesn't have `rbCUDA` and `rbOpenCL` gems (Ruby bindings for  CUDA and OpenCL respectively), we
can't do much with `ArrayFire-rb`.


# Conclusion

`ArrayFire-rb` can be used as a standalone linear algebra library not restricted to GPUs.

A user can change the backend on fly making it easier to leverage the power of CUDA and OpenCL. The
order of preference of default backend to harness maximum computing power helps him
not worry too much about performance tuning in the early stages of development, hence supporting
the philosophy of preferring **convention over configuration**.

In the next blog post, I will discuss about interfacing `ArrayFire-rb` to `NMatrix`.

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