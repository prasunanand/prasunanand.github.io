---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part VI : Device and Util)"
date:   2017-08-22 14:00:00 +0530
categories: arrayfire
comments: true
---

ArrayFire has Device and Util class that contains of methods which can be used to manage the CPU and GPU
devices and various utility functions like printing and storing the arrays.
This blog will explain my work regarding the bindings I have created and how to use them.

# Device

`Device` class contains of singleton methods like `info`, `device_gc`, `lock_device_ptr` that can
be used to get info about the GPU devices used for calculation, explicitly call the garbage collector
and locking the pointers on GPU device.


The implementation is as follows:

```c
void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Device = rb_define_class_under(ArrayFire, "Device", rb_cObject);
  rb_define_singleton_method(Device, "info", (METHOD)arf_info, 0);
  rb_define_singleton_method(Device, "init", (METHOD)arf_init2, 0);
  rb_define_singleton_method(Device, "info_string", (METHOD)arf_info_string, 0);
  rb_define_singleton_method(Device, "device_info", (METHOD)arf_device_info, 0);
  rb_define_singleton_method(Device, "get_device_count", (METHOD)arf_get_device_count, 0);
  rb_define_singleton_method(Device, "get_dbl_support", (METHOD)arf_get_dbl_support, 1);
  rb_define_singleton_method(Device, "set_device", (METHOD)arf_set_device, 1);
  rb_define_singleton_method(Device, "get_device", (METHOD)arf_get_device, 0);
  rb_define_singleton_method(Device, "sync", (METHOD)arf_sync, 1);
  rb_define_singleton_method(Device, "device_mem_info", (METHOD)arf_device_mem_info, 0);
  rb_define_singleton_method(Device, "print_mem_info", (METHOD)arf_print_mem_info, 2);
  rb_define_singleton_method(Device, "device_gc", (METHOD)arf_device_gc, 0);
  rb_define_singleton_method(Device, "set_mem_step_size", (METHOD)arf_set_mem_step_size, 1);
  rb_define_singleton_method(Device, "get_mem_step_size", (METHOD)arf_get_mem_step_size, 0);
  rb_define_singleton_method(Device, "lock_device_ptr", (METHOD)arf_lock_device_ptr, 1);
  rb_define_singleton_method(Device, "unlock_device_ptr", (METHOD)arf_unlock_device_ptr, 1);
  rb_define_singleton_method(Device, "lock_array", (METHOD)arf_lock_array, 1);
  rb_define_singleton_method(Device, "unlock_array", (METHOD)arf_unlock_array, 1);
  rb_define_singleton_method(Device, "is_locked_array", (METHOD)arf_is_locked_array, 1);
  rb_define_singleton_method(Device, "get_device_ptr", (METHOD)arf_get_device_ptr, 0);
}
```

The implementation of device_info is interesting as it has 4 return values in the form of strings.
`ArrayFire::Device.device_info` passes the variables to be returned to  `ArrayFire::Device.device_info_func`
which modifies the contents of the variables passed.

```ruby
module ArrayFire
  class Device
    def self.device_info
      d_name     = ""
      d_platform = ""
      d_toolkit  = ""
      d_compute  = ""
      ArrayFire::Device.device_info_func(d_name, d_platform, d_toolkit, d_compute);
      return d_name, d_platform, d_toolkit, d_compute
    end
  end
end
```

The point to note here is that `ArrayFire::Device.device_info` uses `rb_str_cat2()` to concatenate the `char*`
to the `VALUE` containing empty string.

```c
static VALUE arf_device_info(VALUE self, VALUE name_val, VALUE platform_val, VALUE toolkit_val, VALUE compute_val){
  char* d_name     = (char*)malloc(sizeof(char) * 64);
  char* d_platform = (char*)malloc(sizeof(char) * 10);
  char* d_toolkit  = (char*)malloc(sizeof(char) * 64);
  char* d_compute  = (char*)malloc(sizeof(char) * 10);

  af_device_info(d_name, d_platform, d_toolkit, d_compute);

  rb_str_cat2(name_val,     d_name);
  rb_str_cat2(platform_val, d_platform);
  rb_str_cat2(toolkit_val,  d_toolkit);
  rb_str_cat2(compute_val,  d_compute);

  return Qnil;
}

static VALUE arf_device_mem_info(VALUE self){
  size_t alloc_bytes, alloc_buffers, lock_bytes, lock_buffers;
  af_device_mem_info( &alloc_bytes, &alloc_buffers, &lock_bytes, &lock_buffers);
  printf("Allocated Bytes: %d\nAllocated buffers: %d\nLock Bytes: %d\nLock Buffers: %d\n",
          alloc_bytes, alloc_buffers, lock_bytes, lock_buffers);
  return Qnil;
}

```

Running `pry` to check the bindings:

```ruby
rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> ArrayFire::Device.info
ArrayFire v3.4.0 (CUDA, 64-bit Linux, build 75cad40)
Platform: CUDA Toolkit 7.5, Driver: 375.66
[0] GeForce GTX 750 Ti, 4042 MB, CUDA Compute 5.0
=> nil
[2] pry(main)> ArrayFire::Device.device_info
=> ["GeForce_GTX_750_Ti", "CUDA", "v7.5", "5.0"]
[3] pry(main)> ArrayFire::Device.get_device_count
=> 1
[4] pry(main)> ArrayFire::Device.get_dbl_support(0)
=> true
[5] pry(main)> ArrayFire::Device.device_mem_info
Allocated Bytes: 0
Allocated buffers: 0
Lock Bytes: 0
Lock Buffers: 0
=> nil
[6] pry(main)> arr = ArrayFire::Af_Array.new 2, [4,4], [1, 2, 2, 0, -2, 2 , 1, 3, 1, 4, 3 , 1, 0, -3, 2, 9]
No Name Array
[4 4 1 1]
    1.0000    -2.0000     1.0000     0.0000
    2.0000     2.0000     4.0000    -3.0000
    2.0000     1.0000     3.0000     2.0000
    0.0000     3.0000     1.0000     9.0000

=> #<ArrayFire::Af_Array:0x000000023800c0>
[7] pry(main)> ArrayFire::Device.print_mem_info("mem info", 0)
mem info
---------------------------------------------------------
|     POINTER      |    SIZE    |  AF LOCK  | USER LOCK |
---------------------------------------------------------
|     0x702f80000  |       1 KB |       Yes |        No |
|     0x702f80400  |       1 KB |        No |        No |
---------------------------------------------------------
=> nil
[8] pry(main)> ArrayFire::Device.device_mem_info
Allocated Bytes: 2048
Allocated buffers: 2
Lock Bytes: 1024
Lock Buffers: 1
=> nil
[9] pry(main)> ArrayFire::Device.get_mem_step_size
=> 1024
[10] pry(main)> ArrayFire::Device.is_locked_array(arr)
=> false
[11] pry(main)> ArrayFire::Device.lock_array(arr)
=> true
[12] pry(main)> ArrayFire::Device.is_locked_array(arr)
=> true
```

# Util

Util class contains of methods responsible for printing an Af_Array, saving it in a file
or converting it to string and other utility methods.

The implementation is as follows:


```c
void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Util = rb_define_class_under(ArrayFire, "Util", rb_cObject);
  rb_define_singleton_method(Util, "print_array", (METHOD)arf_print_array, 1);
  rb_define_singleton_method(Util, "print_array_gen", (METHOD)arf_print_array_gen, 0);
  rb_define_singleton_method(Util, "save_array", (METHOD)arf_save_array, 4);
  rb_define_singleton_method(Util, "read_array_index", (METHOD)arf_read_array_index, 0);
  rb_define_singleton_method(Util, "read_array_key", (METHOD)arf_read_array_key, 0);
  rb_define_singleton_method(Util, "read_array_key_check", (METHOD)arf_read_array_key_check, 0);
  rb_define_singleton_method(Util, "array_to_string", (METHOD)arf_array_to_string, 4);
  rb_define_singleton_method(Util, "get_version", (METHOD)arf_get_version, 0);
  rb_define_singleton_method(Util, "get_revision", (METHOD)arf_get_revision, 0);
  rb_define_singleton_method(Util, "get_size_of", (METHOD)arf_get_size_of, 1);
}

```
`af_array_to_string` API has also been used to implement `ArrayFire::Af_Array#to_s`.

The implementation of `arf_get_version` is interesting as it returns a hash value that represents
the version of `ArrayFire` C library installed using the keys as `major`, `minor` and `patch`.

`rb_hash_new` and `rb_hash_aset` has been used to create a hash.

```c
static VALUE arf_print_array(VALUE self, VALUE input_val){
  afstruct* input;

  Data_Get_Struct(input_val, afstruct, input);

  af_print_array(input->carray);
  return Qtrue;
}

static VALUE arf_save_array(VALUE self, VALUE key_val, VALUE array_val, VALUE fn_val, VALUE append){
  afstruct* input;

  Data_Get_Struct(array_val, afstruct, input);
  const char* key = StringValueCStr(key_val);
  const char* filename = StringValueCStr(fn_val);
  int index;
  af_save_array (&index, key, input->carray, filename, RTEST(append));
  return INT2NUM(index);
}

static VALUE arf_array_to_string(VALUE self, VALUE exp_val, VALUE array_val, VALUE precision, VALUE transpose){
  char* output;
  afstruct* input;

  Data_Get_Struct(array_val, afstruct, input);
  const char* exp = StringValueCStr(exp_val);
  af_array_to_string(&output, exp, input->carray, NUM2INT(precision), RTEST(transpose));

  return rb_str_new_cstr(output);
}


static VALUE arf_get_version(VALUE self){
  int major, minor, patch;
  af_get_version(&major, &minor, &patch);

  VALUE hash = rb_hash_new();
  rb_hash_aset(hash, rb_str_new_cstr("major"), INT2NUM(major));
  rb_hash_aset(hash, rb_str_new_cstr("minor"), INT2NUM(minor));
  rb_hash_aset(hash, rb_str_new_cstr("patch"), INT2NUM(patch));
  return hash;
}
```

Lets use pry to check the bindings:

```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> arr = ArrayFire::Af_Array.new 2, [4,4], [1, 2, 2, 0,  -2, 2 , 1, 3, 1, 4, 3 , 1, 0, -3, 2, 9]
No Name Array
[4 4 1 1]
    1.0000    -2.0000     1.0000     0.0000
    2.0000     2.0000     4.0000    -3.0000
    2.0000     1.0000     3.0000     2.0000
    0.0000     3.0000     1.0000     9.0000

=> #<ArrayFire::Af_Array:0x000000026bde18>
[2] pry(main)> ArrayFire::Util.print_array(arr)
No Name Array
[4 4 1 1]
    1.0000    -2.0000     1.0000     0.0000
    2.0000     2.0000     4.0000    -3.0000
    2.0000     1.0000     3.0000     2.0000
    0.0000     3.0000     1.0000     9.0000

=> true
[3] pry(main)> x = ArrayFire::Util.array_to_string("GPU Array", arr, 5, false)
=> "GPU Array\n[4 4 1 1]\n    1.00000     2.00000     2.00000     0.00000 \n   -2.00000     2.00000     1.00000     3.00000 \n    1.00000     4.00000     3.00000     1.00000 \n    0.00000    -3.00000     2.00000     9.00000 \n\n"
[4] pry(main)> puts x
GPU Array
[4 4 1 1]
    1.00000     2.00000     2.00000     0.00000
   -2.00000     2.00000     1.00000     3.00000
    1.00000     4.00000     3.00000     1.00000
    0.00000    -3.00000     2.00000     9.00000

=> nil
[5] pry(main)> ArrayFire::Util.get_version
=> {"major"=>3, "minor"=>4, "patch"=>0}
[6] pry(main)> ArrayFire::Util.get_revision
=> "75cad40"
[7] pry(main)> ArrayFire::Util.get_size_of(:f64)
=> 8
```

The bindings work!.

# Conclusion

We can easily manage the available GPU devices and manage the memory. Also, we can save the `Af_Array`
output to a file among other utilities.

In the next blog post, I will explain about using multiple backends using `ArrayFire` , i.e. OpenCL, CUDA
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