---
layout: post
title:  "RbCUDA: CUDA bindings for Ruby"
date:   2017-12-30 12:10:41 +0530
categories: cuda opencl ruby rbcuda
comments: true
---

I have been working on a new project called **RbCUDA**.

In this project, I want to make it possible to combine the
beauty of Ruby with transparent GPU processing with minimal overheads, so that software developers can easily use
that power when available, and farm out computations transparently to GPU and CPU.

Nvidia has been developing a lot of GPU accelerated libraries for linear algebra(CUDA, cuBLAS, cuSolver), Random Number
Generation(cuRand), fast-fourier transform(cuFFT), Parallel Primitives and Data Structures(Thrust) and image processing
(NVIDIA Performance Primitives Library). Many Python/Julia/C++ libraries are being built on top of these libraries.
RbCUDA would fill this gap in the Ruby ecosystem making it a highly-preferable option for GPU computing.
It will work on Nvidia hardware running on client computers and on servers that make use of TESLA's.

Recently, I was at Nvidia Developer Connect in my city. I was completely amazed by the new hardware launched by Nvidia this year. It
makes me really confident about the great impact this project will create in the Ruby ecosystem.

# Previous Efforts

[sgc-ruby-cuda](https://github.com/xman/sgc-ruby-cuda) is an existing alternative for CUDA Ruby bindings. However, this library just helps in executing custom kernels.
It also doesn't have support cuBLAS, and other cuMath libraries.


# Objectives

The main objectives of RbCUDA are:

1. Map all of CUDA into Ruby
2. Ready-made on-GPU linear algebra, reduction, scan using cuBLAS, cuMath, cuSolver libraries.
3. Random Numer generator using cuRand
4. Near-zero wrapping overhead.
5. CUDA profiler for Ruby.

In the near future:

1. fast-fourier transform(cuFFT)
2. Parallel Primitives and Data Structures(Thrust)
3. Image processing (NVIDIA Performance Primitives Library).
4. Use CuDNN to power a Deep Learning Library written in Ruby.

# Codebase

[https://github.com/prasunanand/rbcuda](https://github.com/prasunanand/rbcuda)

Contributions are welcome!

# Example

Most of the times, when we want to use CUDA for accelerating our code, we end up optimizing matrix-multiplication.
I wrote an [example](https://github.com/prasunanand/rbcuda/blob/master/examples/matmul.rb) that showcases how RbCUDA
is the most efficient Ruby library to be used for Number crunching.

The example copies two matrices from CPU to GPU, runs matrix multiplication over it. Then the resulting matrix is copied
back to the CPU from GPU.

I benchmarked my code and compare it with other existing Ruby libraries.

![rbcuda_gemm](https://github.com/prasunanand/resume/blob/master/img/rbcuda/rbcuda_gemm.png?raw=true "Fig.1. Matrix Multiplication")

(Note: The above benchmarks have been done on an AMD FX 8350 octacore processor and Nvidia GTX 750Ti GPU.
CUDA backend of ArrayFire was used with double floating points.)

**RbCUDA is the fastest among all. Yay!**

RbCUDA is the fastest of all the Ruby libraries. The time taken for matrix multiplication is 0.000017s on my machine. The plain C code
takes me 0.000013s for this calculation.

RbCUDA is 24x faster than ArrayFire for matrix multiplication, Most of the speed gain going straight to CUDA is probably from
removing an interaction layer (and buffers) as well as how the data is organized and fed to the underlying architecture.

Hence, an overhead of 0.000004s over plain C code makes, it highly efficient Maths library in Ruby.

The great thing about this example is that the code is very Rubyish <3.

The Code Implementation of matrix multiplication will be discussed in my upcoming blog posts.


# Profiling matrix multiplication.

I have also created a profiler for RbCUDA . The profiling example can be found [here](https://github.com/prasunanand/rbcuda/blob/master/examples/profiler.rb).

Output of the code.

```json
# CUDA_PROFILE_LOG_VERSION 2.0
# CUDA_DEVICE 0 GeForce GTX 750 Ti
# CUDA_CONTEXT 1
# TIMESTAMPFACTOR 14e96c24317d8324
method,gputime,cputime,occupancy
method=[ memcpyHtoD ] gputime=[ 16.544 ] cputime=[ 18.705 ]
method=[ memcpyHtoD ] gputime=[ 16.288 ] cputime=[ 22.089 ]
method=[ memcpyHtoD ] gputime=[ 1.216 ] cputime=[ 6.923 ]
method=[ _Z19gemm_kernel2x2_coreIdLb0ELb0ELb0ELb0ELb0EEvPT_PKS0_S3_iiiiiiS1_S1_S0_S0_i ] gputime=[ 76.736 ] cputime=[ 11.967 ] occupancy=[ 0.469 ]
method=[ _Z19gemm_kernel2x2_coreIdLb0ELb0ELb0ELb0ELb0EEvPT_PKS0_S3_iiiiiiS1_S1_S0_S0_i ] gputime=[ 73.024 ] cputime=[ 6.485 ] occupancy=[ 0.469 ]
method=[ _Z19gemm_kernel2x2_coreIdLb0ELb0ELb0ELb0ELb0EEvPT_PKS0_S3_iiiiiiS1_S1_S0_S0_i ] gputime=[ 72.928 ] cputime=[ 5.739 ] occupancy=[ 0.469 ]
method=[ _Z19gemm_kernel2x2_coreIdLb0ELb0ELb0ELb0ELb0EEvPT_PKS0_S3_iiiiiiS1_S1_S0_S0_i ] gputime=[ 72.928 ] cputime=[ 5.725 ] occupancy=[ 0.469 ]
method=[ _Z19gemm_kernel2x2_coreIdLb0ELb0ELb0ELb0ELb0EEvPT_PKS0_S3_iiiiiiS1_S1_S0_S0_i ] gputime=[ 72.896 ] cputime=[ 5.701 ] occupancy=[ 0.469 ]
```
(Note: The unit of time is microsecond).



# Ruby Grant 2017

This project is funded by Ruby Association. I am very thankful to them for supporting this project.
[Link](http://www.ruby.or.jp/en/news/20171206).

# Contributions are welcome!

I request all the Rubyists if you have a Ruby code that you want to be accelerated by GPU, please try RbCUDA / ArrayFire. If you are
into Deep learning, let me know if you want to use RbCUDA to power your neural nets for GPU acceleration.

Feel free to open an issue!

Stay tuned for more posts about GPU computing with Ruby.

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
