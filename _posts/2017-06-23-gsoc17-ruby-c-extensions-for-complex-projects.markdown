---
layout: post
title:  "Ruby C extensions for complex projects"
date:   2017-06-23 13:18:41 +0530
categories: ruby-c-extensions
comments: true
author: Prasun Anand
banner: /images/gsoc2017.png
---

In this blog and a few others that will follow, I would share my expereiences creating
Ruby Bindings for C/C++ libraries. It covers a practical example rather than a
`Hello world!` or `chairs and tables` examples.

When I started working on ArrayFire bindings for Ruby, I was searching on
the Internet `How to create Ruby C extensions?` I was able to learn the basics but
I wasn't able to figure out `how to implement it` for a practical application.

For example, if you are working on a  **Number Cruncing** library, you need to handle
data of different types like double, float, int, unsigned int, complex. To handle
all these data types, to prevent repeatition of code, we need templates. But  C doesn't
support templates and you need to use C++ to do it.  But you never learnt to bind C++ to
Ruby.

Hence, I am writing this blog post to explain how to engineer complex Ruby applications that take
advantage of C/C++ libraries. I will explain it by citing examples from **NMatrix**,
and **ArrayFire**.

# Basics

The first step of creating a Ruby binding is to create a shared object file that binds to
your ruby code. The shared object contains information about your Ruby Modules, Classes,
Methods and Variables.

An example tutorial which I like a lot, can be seen [here](https://tenderlovemaking.com/2009/12/18/writing-ruby-c-extensions-part-1.html) and [here](https://tenderlovemaking.com/2010/12/11/writing-ruby-c-extensions-part-2.html).

Now the challenging task would be how you will use C++, if you want to use Object Oriented
paradigm of C++.



# Directory Structure

```tree
├── ext
│   └── mri
│       ├── arith.cpp
│       ├── arrayfire.c
│       ├── blas.cpp
│       ├── extconf.rb
│       ├── lapack.cpp
│       ├── mkmf.rb
│       ├── ruby_arrayfire.cpp
│       └── ruby_arrayfire.h
├── lib
│   ├── arrayfire
│   │   └── arrayfire.rb
│   └── arrayfire.rb
└── Rakefile

```

# Compiling

NMatrix uses [mkmf.rb](https://github.com/prasunanand/arrayfire-rb/blob/master/ext/mri/mkmf.rb) file
which helps you compile C++ and C code. If you want to explore more, you can look into what this code
does.

mkmf.rb helps you create an entry to shared object is through a C++ files that also contains the
C files. The C file contains all the directives responsible for creating Ruby modules, classes
, methods and variables and to prevent mangling we use extern to refer C and C++ code.


# Makefile

The extconf.rb needs to have a little modifcations that would help the Makefile find the
source files, dependencies and output the `.so` file.

**extconf.rb**
```ruby
require_relative 'mkmf.rb'

extension_name = 'arrayfire'


$INSTALLFILES = [
  ['ruby_arrayfire.h'       , '$(archdir)'],
  ['ruby_arrayfire.hpp'     , '$(archdir)'],
  ['arrayfire_config.h', '$(archdir)'],
]

$DEBUG = true
$CFLAGS = ["-Wall -Werror=return-type",$CFLAGS].join(" ")
$CXXFLAGS = ["-Wall -Werror=return-type",$CXXFLAGS].join(" ")
$CPPFLAGS = ["-Wall -Werror=return-type",$CPPFLAGS].join(" ")


LIBDIR      = RbConfig::CONFIG['libdir']
INCLUDEDIR  = RbConfig::CONFIG['includedir']

HEADER_DIRS = [
  '/opt/local/include',
  '/usr/local/include',
  INCLUDEDIR,
  '/usr/include'
]

LIB_DIRS = [
  '/opt/local/lib',
  '/usr/local/lib',
  LIBDIR,
  '/usr/lib'
]

dir_config(extension_name, HEADER_DIRS, LIB_DIRS)

have_library('afcuda')
have_library('cusolver')
have_library('cudart')
have_library('cufft')
have_library('cublas')

basenames = %w{ruby_arrayfire}
$objs = basenames.map { |b| "#{b}.o"   }
$srcs = basenames.map { |b| "#{b}.cpp" }

create_conf_h("arrayfire_config.h")
create_makefile(extension_name)
```

## Return type

In the headerfile, we can add info regarding how to cast the objects and juggle them
easily between C and C++ code.

Each Ruby binding must return a VALUE and we need to cast it which can be seen in the
following lines of code.

**ruby_arrayfire.h**

```cpp
#ifndef RUBY_ARRAYFIRE_H
  #define RUBY_ARRAYFIRE_H
#endif

/*
 * Functions
*/

#ifdef __cplusplus
typedef VALUE (*METHOD)(...);
#endif

#include <ruby.h>
#ifdef __cplusplus
extern "C" {
#endif

  void Init_arrayfire();

#ifdef __cplusplus
}
#endif

```

# Name Mangling

Now since you are loading the C file through a C++ interface you need to take care of casting the
return value from an expression.

A C++ compiler distinguishes between different functions when it generates object code by
adding extra information about arguments to the function name, which is called Name Mangling.

Hence, whenever we import C code, we place it in `extern "C"` block.

The following code shows how to use it.

Here we create an `arf` namespace and we create a method `test_cpp` that will print
"Set up is successful!". `arf::test_cpp` will be called by `ArrayFire#test`. `test` method
will be defined in C and will call `arf::test_cpp`.

**ruby_arrayfire.cpp**
```c
#include <ruby.h>
#include <algorithm>
#include <fstream>
#include <arrayfire.h>
#include <stdio.h>
#include <math.h>

/*
 * Project Includes
 */

#include "arrayfire.h"
#include "ruby_arrayfire.h"

namespace arf {

  static void test_cpp()
  {
    printf("Setup is successful!");
  }
}
extern "C" {
  #include "arrayfire.c"
}
```

# Ruby C bindings

This is the piece of code where we create the Ruby bindings.

**arrayfire.c**

```c
VALUE ArrayFire = Qnil;
static VALUE test(VALUE self);

void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");
  rb_define_method(ArrayFire, "test", (METHOD)test, 0);
}

VALUE test(VALUE self) {
  arf::test_cpp();
  return Qnil;
}

```

# Loading the Shared Library

**lib/arrayfire/arrayfire.rb**

```ruby
require 'ext/arrayfire.so'
```

# Conclusion

This is how we have created our basic layout for Ruby C extension with C and C++.

Now, we will create some arrayfire bindings.

In the following blogs, I will write about building upon this codebase. I will
introduce templates and later Garbage collection .

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