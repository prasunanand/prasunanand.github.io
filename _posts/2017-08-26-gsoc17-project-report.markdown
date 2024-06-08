---
layout: post
title:  "GSoC 2017: Creating the fastest math libraries for Ruby by using the GPU through OpenCL and ArrayFire."
date:   2017-08-28 08:10:41 +0530
categories: arrayfire cuda opencl ruby
comments: true
author: Prasun Anand
banner: /images/banner.png
---

GSoC 2017 is about to end. This post summarises my work during the course of summer.
todo:
I have been working on "Port NMatrix to JRuby" as my GSoC project. I am pleased to announce that **JRuby is ready for Nmatrix users**.

NMatrix, a linear algebra library wraps Apache Commons Maths for its core functionalities. By the end of GSoC, I have been able to implement NMatrix for dense matrices with double and object ( ruby objects ) data type. I have also worked on porting mixed-models gem to JRuby which heavily uses NMatrix at its core.


# Application

The GSoC 2017 application can be found [here](https://github.com/prasunanand/resume/wiki/GSoC-2017-proposal).

# Code

[ArrayFire-rb](https://github.com/prasunanand/arrayfire-rb): The [pull request](https://github.com/arrayfire/arrayfire-rb/pull/3) is undergoing a review.

ArrayFire-rb Benchmarks: Codebase can be found [here](https://github.com/prasunanand/arrayfire-rb-benchmark-suite).

Bio::FasterLmmD : Codebase can be found [here](https://github.com/prasunanand/bio-faster_lmm_d)

# Goals

ArrayFire-rb now supports linear algebra on GPU and CPU. Currently only **double** dtype has been implemented.
It supports dense and sparse matrices. It has multiple backends namely, CUDA, OpenCL and CPU.

The work on creating the bindings have been explained in last nine blog posts:

1. [Ruby C extensions for complex projects](/ruby-c-extensions/2017/06/23/gsoc17-ruby-c-extensions-for-complex-projects.html)
2. [Installation](/arrayfire/2017/06/23/gsoc17-arrayfire-ruby-bindings-part-1-installation.html)
3. [Af_Array](/arrayfire/2017/07/04/gsoc17-arrayfire-ruby-bindings-part-2-af_array.html)(see performance)
4. [Test-suite and Algorithm class](/arrayfire/2017/07/22/gsoc17-arrayfire-ruby-bindings-part-3-minitest-algorithm.html)
5. [BLAS and LAPACK routines](/arrayfire/2017/08/16/gsoc17-arrayfire-ruby-bindings-part-4-blas-lapack.html)(see performance)
6. [Statistics and Random Engine routines](/arrayfire/2017/08/17/gsoc17-arrayfire-ruby-bindings-part-4-statistics-and-random-engine.html)
7. [Device and Util](/arrayfire/2017/08/22/gsoc17-arrayfire-ruby-bindings-part-6-device.html)
8. [Multiple Backends: CUDA, OpenCL and CPU](/arrayfire/2017/08/24/gsoc17-arrayfire-ruby-bindings-part-7-backend-cuda-and-opencl.html)
9. [ArrayFire-NMatrix Interface](/arrayfire/2017/08/24/gsoc17-arrayfire-ruby-bindings-part-8-nmatrix-interface.html)

The performance of ArrayFire-rb is outstanding as expected.

I took a side-track working on `Bio::FasterLmmD` . This work is not complete and still in progress.
It is an effort to `call D from Ruby`. The work has been explained in a previous [blog post](/gpu-computing/2017/07/25/gsoc17-calling-d-from-ruby-for-gpu-computing.html).

The work on ArrayFire-rb - JRuby has been postponed for now as I wanted to concentrate on MRI for
the best results.

# Future Work

The future work involves improving the ArrayFire-rb code and writing tutorials. ArrayFire is not limited to
linear algebra so I will create bindings for Signal Processing, Computer Vision, etc. I will also add support
for data types other than `double`.

The work on ArrayFire-rb - JRuby will begin as soon as ArrayFire gem is published.

# FOSS

This has been my second GSoC with SciRuby. It has been more than an year contibuting extensively to FOSS.
It has made me a 1000X better programmer that I used to be.

I really appreciate the effort by Google Open Source Committee for conducting GSoC every year. It is the
best platform for the aspiring programmers improve their skill and give back to society by developing free
and open source software.

Last year's GSoC work helped me to present a talk at FOSDEM 2017 and Ruby Conf India 2017.  I got active
in the Indian Ruby Community. Recently, I have been invited as a speaker to Ruby World Conference 2017, Matsue, Japan
to talk on "GPU computing with Ruby".

I plan to continue contributing to open source, strive for improving my skills, and help new programmers
contribute to FOSS. I would be glad if I could mentor students for upcoming GSoCs.

# Acknowledgements

I would like to express my sincere gratitude to my mentor Pjotr Prins, for his guidance, patience and support.
I have learn a lot from him since my last GSoC and still learning. I couldn't have hoped for a better mentor.

I am grateful to Google and the Ruby Science Foundation for this golden opportunity.

I am very thankful to John Woods, Sameer Deshmukh, Alexej Gossmann, Gaurav Tamba and Pradeep Garigipati
who mentored me through the project.

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