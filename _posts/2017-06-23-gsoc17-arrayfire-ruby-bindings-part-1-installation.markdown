---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part I : Installation)"
date:   2017-06-23 14:15:00 +0530
categories: arrayfire
comments: true
author: Prasun Anand
banner: /images/gsoc2017.png
---

I have been working on creating ArrayFire bindings for Ruby. ArrayFire is an opensource
library that is very useful and highly popular for GPGPU computings. It has strong abstractions that makes
it very easy for a programmer to benefit from GPU without being bothered about the configurations.

I will be creating a blog series regarding that will explain how I created Ruby and JRuby bindings for
ArrayFire and how Ruby programmers can use ArrayFire to get free and easy speed improvements with minimum
effort. I will start with MRI bindings.

Let the quest begin!

To use ArrayFire, the first thing you need to do is install it.

## Installation :

On a Debian machine, I would do

```sh
sudo apt-get install libarrayfire-opencl3
sudo apt-get install libarrayfire-opencl-dev
```

For other OS, you need to checkout this [link](http://arrayfire.org/docs/installing.htm)

# Building from source

```sh
git clone https://github.com/prasunanand/arrayfire-rb
cd arrayfire-rb
bundle install
rake compile
```

# Installing the gem

```sh
gem build arrayfire.gemspec
gem install arrayfire-0.0.0.gem
```

Now you have got arrayFire installed on the machine, lets check it by running this
piece of code in `pry`. We want to make sure that ArrayFire can detect the GPU devices
on our machine.


```ruby
pry
[1] pry(main)> require 'arrayfire'
=> true
[2] pry(main)> ArrayFire::Device.info()
ArrayFire v3.4.0 (OpenCL, 64-bit Linux, build 75cad40)
[0] NVIDIA  : GeForce GTX 750 Ti, 4041 MB
=> nil
```

```
ruby device.rb
```

This piece of Ruby code will output the GPU devices that are available on
your machine.


So, now we get into the implementation:

An introduction to how we setup the project can be found [here](/ruby-c-extensions/2017/06/23/gsoc17-ruby-c-extensions-for-complex-projects.html).

We create the bindings for `ArrayFire::Device` class;

```ruby

VALUE Device = Qnil;
static VALUE arf_info(VALUE self);

# Creating the Device class

Device = rb_define_class_under(ArrayFire, "Device", rb_cObject);

# Creating singleton method info

rb_define_singleton_method(Device, "info", (METHOD)arf_info, 0);

static VALUE arf_info(VALUE self){
  #C API to get device info
  af_info();
  return Qnil;
}

```

# Introducing Af_Array

Now, lets have a look at Af_Array. An Af_Array currently expects a two-dimensional
array. I have implemented matrix addition and matrix multiplication.

You can try it as follows:

```ruby
pry
[1] pry(main)> require 'arrayfire'
=> true
[2] pry(main)> a = ArrayFire::Af_Array.new 2, [2,2],[1,2,3,4]
=> #<ArrayFire::Af_Array:0x00000001aa3b50>
[3] pry(main)> b = ArrayFire::Af_Array.new 2, [2,2],[1,2,3,4]
=> #<ArrayFire::Af_Array:0x00000001970738>
[4] pry(main)> c = a + b
=> #<ArrayFire::Af_Array:0x0000000191a1a8>
[5] pry(main)> c.elements
=> [2.0, 4.0, 6.0, 8.0]
[6] pry(main)> d = ArrayFire::BLAS.matmul(a,b)
=> #<ArrayFire::Af_Array:0x00000001626258>
[7] pry(main)> d.elements
=> [7.0, 10.0, 15.0, 22.0]
```

Please note that there may be issues with Intel GPUs that don't support double precision decimals.

# Conclusion

We were successfully able to run ArrayFire using Ruby and could detect the GPU
hardware available. We were also able to create an Af_Array object. We could
add two arrays and also do matrix multiplication.

In the next blog, I would create bindings for Array class and how I implemeted
BLAS routines and Arithmetic operations.

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