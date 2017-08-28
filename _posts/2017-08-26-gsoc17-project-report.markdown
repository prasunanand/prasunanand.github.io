---
layout: post
title:  "GSoC 2017: Creating the fastest math libraries for Ruby by using the GPU through OpenCL and ArrayFire."
date:   2017-08-28 08:10:41 +0530
categories: arrayfire cuda opencl ruby
comments: true
---

GSoC 2017 is about to end. This post summarises my work during the course of summer.

# Application

The GSoC 2017 application can be found [here](https://github.com/prasunanand/resume/wiki/GSoC-2017-proposal).

# Code

ArrayFire-rb: The [pull request](https://github.com/arrayfire/arrayfire-rb/pull/3) is undergoing a review.

ArrayFire-rb Benchmarks: Codebase can be found [here](https://github.com/prasunanand/arrayfire-rb-benchmark-suite).

Bio::FasterLmmD : Codebase can be found [here](https://github.com/prasunanand/bio-faster_lmm_d)

# Goals

ArrayFire-rb now supports linear algebra on GPU and CPU. Currently only float dtype has been implemented.
It supports dense and sparse matrices. It has multiple backends namely, CUDA, OpenCL and CPU.

The work on creating the bindings have been explained in last ten blog posts.

The performance of ArrayFire-rb is outstanding as expected.

I took a side-track working on `Bio::FasterLmmD` . This work is not complete and still in progress.
It is an effort to `call D from Ruby`. The work has been explaiined in a previous blog post.

The work on ArrayFire-rb - JRuby has been postponed for now as I wanted to concentrate on MRI for
the best results.

# Future Work

The future work involves improving the ArrayFire-rb code and writing tutorials. ArrayFire is not limited to
linear algebra so I will create bindings for Signal Processing, Computer Vision, etc.

The work on ArrayFire-rb - JRuby will begin as soon as ArrayFire gem is published.

# FOSS

This has been my second GSoC with SciRuby. It has been more than an year contibuting extensively to FOSS.
It has made me a 1000X better programmer that I used to be.

I really appreciate the effort by Google Open Source Committee for conducting GSoC every year. It is the
best platform for the aspiring programmers improve their skill and give back to society by developing free
and open source software.

Last year's GSoC work helped me to present a talk at FOSDEM 2017 and Ruby Conf India 2017.  I got active
in the Indian Ruby Community. This year, I have been invited as a speaker to Ruby World Conference 2017, Matsue, Japan.

I plan to continue contributing to open source, strive for improving my skills, and help new programmers
contribute to FOSS. I would be glad if I could mentor students next year for upcoming GSoCs.

# Acknowledgements

I would like to express my sincere gratitude to my mentor Pjotr Prins. I have learn a lot from
him since my last GSoC.

I am grateful to Google and the Ruby Science Foundation for this golden opportunity.

I am very thankful to John Woods, Sameer Deshmukh, Alexej Gossmann and Pradeep Garigipati
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