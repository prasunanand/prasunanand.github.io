---
layout: post
title:  "ArrayFire Ruby Bindings<br>(Part III : Test-suite and Algorithm class)"
date:   2017-07-22 10:01:00 +0530
categories: arrayfire
comments: true
---

This post covers how I implemented the test-suite and `Algorithm` class for `ArrayFire-rb` using  ArrayFire C API, and
how to use `Algorithm` class methods with `Af_Array`.

# Test suite

I have used `minitest` for writing the tests for `ArrayFire-rb`.

To assert if two arrays are equal, I implemented `Af_Array#==` method. I used `af_eq` api for implementing `==`.
However `af_eq` method checks for exact matches and thus
doesn't work if the values are correct upto a certain number of decimal places. So, I can't use `==` to test the output
of Trigonometric methods , for-example, `Af_Array#sin`. I implemented `Af_Array#approx_equal` that checks if the values are
correct upto three decimal places.


This is how `arith_test.rb` looks like:
```ruby

class ArrayFire::ArithTest < Minitest::Test

  def setup
    @a = ArrayFire::Af_Array.new 2, [2,2],[1,2,3,4]
    @b = ArrayFire::Af_Array.new 2, [2,2],[2,4,6,8]
    @elements = [10, -11, 48, 21, 65, 0, 1, -7, 112]
    @af_array =  ArrayFire::Af_Array.new 2, [3,3], @elements
  end

  def test_addition
    c = ArrayFire::Af_Array.new 2, [2,2],[3,6,9,12]
    assert_equal c, @a + @b
  end

  def test_subtraction
    assert_equal @a, @b - @a
  end

  def test_multiplication
    c = ArrayFire::Af_Array.new 2, [2,2],[2,8,18,32]
    assert_equal c, @b * @a
  end

  def test_division
    c = ArrayFire::Af_Array.new 2, [2,2],[2,2,2,2]
    assert_equal c, @b / @a
  end

  [:sin, :cos, :tan, :sinh, :cosh, :tanh].each do |method|
    define_method("test_#{method}") do
      x = @elements.map{ |e| Math.send(method, e) }
      res_arr =  ArrayFire::Af_Array.new 2, [3,3], x
      assert res_arr.approx_equal @af_array.send method
    end
  end
end

```

The implementation of `==` and `approx_equal` are as follows:

```c
rb_define_method(Af_Array, "==",(METHOD)arf_eqeq,1);
rb_define_method(Af_Array, "approx_equal",(METHOD)arf_eqeq_approx,1);

static VALUE arf_eqeq(VALUE left_val, VALUE right_val) {
  afstruct* left;
  afstruct* right;
  afstruct* result = ALLOC(afstruct);
  Data_Get_Struct(left_val, afstruct, left);
  Data_Get_Struct(right_val, afstruct, right);
  af_eq(&result->carray,  left->carray, right->carray, true);

  dim_t count;
  af_get_elements(&count, result->carray);
  bool* data = (bool*)malloc(count * sizeof(bool));
  af_get_data_ptr(data, result->carray);

  for (dim_t index = 0; index < count; index++){
    if(!data[index]){
      return Qfalse;
    }
  }
  return Qtrue;
}


static VALUE arf_eqeq_approx(VALUE left_val, VALUE right_val) {

  afstruct* left;
  afstruct* right;

  dim_t left_count;
  dim_t right_count;

  Data_Get_Struct(left_val, afstruct, left);
  Data_Get_Struct(right_val, afstruct, right);

  af_get_elements(&left_count, left->carray);
  af_get_elements(&right_count, right->carray);

  if(left_count != right_count){return Qfalse;}

  float* left_arr = (float*)malloc(left_count * sizeof(float));
  af_get_data_ptr(left_arr, left->carray);

  float* right_arr = (float*)malloc(left_count * sizeof(float));
  af_get_data_ptr(right_arr, right->carray);

  for (dim_t index = 0; index < left_count; index++){
    float diff = left_arr[index] - right_arr[index];
    if(diff < 0){diff *= -1;}
    if(diff > 1e-3){
      return Qfalse;
    }
  }
  return Qtrue;
}

```


# Algorithm class

The Algorithm class contains of reduction methods like `sum`, `product`, `max`.
It contains singleton methods that takes an `Af_Array` as a parameter.

```c
void Init_arrayfire() {
  ArrayFire = rb_define_module("ArrayFire");

  Algorithm = rb_define_class_under(ArrayFire, "Algorithm", rb_cObject);
  rb_define_singleton_method(Algorithm, "sum", (METHOD)arf_sum, 2);
  rb_define_singleton_method(Algorithm, "sum_nan", (METHOD)arf_sum_nan, 3);
  rb_define_singleton_method(Algorithm, "product", (METHOD)arf_product, 2);
  rb_define_singleton_method(Algorithm, "product_nan", (METHOD)arf_product_nan, 3);
  rb_define_singleton_method(Algorithm, "min", (METHOD)arf_min, 2);
  rb_define_singleton_method(Algorithm, "max", (METHOD)arf_max, 2);
  rb_define_singleton_method(Algorithm, "all_true", (METHOD)arf_all_true, 2);
  rb_define_singleton_method(Algorithm, "any_true", (METHOD)arf_any_true, 2);
  rb_define_singleton_method(Algorithm, "count", (METHOD)arf_count, 2);
  rb_define_singleton_method(Algorithm, "sum_all", (METHOD)arf_sum_all, 1);
  rb_define_singleton_method(Algorithm, "sum_nan_all", (METHOD)arf_sum_nan_all, 2);
  rb_define_singleton_method(Algorithm, "product_all", (METHOD)arf_product_all, 1);
  rb_define_singleton_method(Algorithm, "product_nan_all", (METHOD)arf_product_nan_all, 2);
  rb_define_singleton_method(Algorithm, "min_all", (METHOD)arf_min_all, 1);
  rb_define_singleton_method(Algorithm, "max_all", (METHOD)arf_max_all, 1);
}
```

`Algorithm#sum` expects an `Af_Array` and `dimension` as a prameter. It finds the sum of
all elements in the `Af_Array` along the specified `dimension`. However, `sum_all` finds the overall
sum of elements in an `Af_Array`.

If `NaN` is one of the element, we use `Af_Array#sum_nan` or `Af_Array#sum_nan_all` that just takes
an additional value as an input which replaces `NaN`.


So, now I can check if the bindings work successfully.

The implementation of `Algorithm#sum` and `Algorith#sum_all` is as follows:


```c

static VALUE arf_sum(VALUE self, VALUE array_val, VALUE dim_val){
  afstruct* input;
  afstruct* output = ALLOC(afstruct);

  Data_Get_Struct(array_val, afstruct, input);

  af_sum(&output->carray, input->carray, FIX2INT(dim_val));

  return Data_Wrap_Struct(CLASS_OF(array_val), NULL, arf_free, output);
}

static VALUE arf_sum_all(VALUE self, VALUE array_val){
  afstruct* input;
  double real_part, imag_part;

  Data_Get_Struct(array_val, afstruct, input);

  af_sum_all(&real_part, &imag_part, input->carray);

  return DBL2NUM(real_part);
}

```

`Data_Get_Struct` takes an `Af_Array` value and unwraps it to a `af_array` struct.
Next, the ArrayFire C API `af_sum` or `af_sum_all` is called on the parameters. The
result is returned by converting it into a Ruby `VALUE`.


```ruby
$ rake pry
pry -r './lib/arrayfire.rb'
[1] pry(main)> input = ArrayFire::Af_Array.new 2, [3,3], [4, 1, 5, 6, -11, 9 , -22, 11, 1]

No Name Array
[3 3 1 1]
    4.0000     6.0000   -22.0000
    1.0000   -11.0000    11.0000
    5.0000     9.0000     1.0000

=> #<ArrayFire::Af_Array:0x0000000176b938>
[2] pry(main)> result = ArrayFire::Algorithm.sum(input, 1)
=> #<ArrayFire::Af_Array:0x00000001810f50>
[3] pry(main)> result.elements
=> [-12.0, 1.0, 15.0]
[4] pry(main)> result = ArrayFire::Algorithm.sum_all(input)
=> 4.0

```

Voila! It works.

# Conclusion

**ArrayFire-rb** has a test-suite and the Algorithm class. Some of the methods of `Algorithm` class
are missing and will be added soon.

In the next blog, I will explain about the BLAS and LAPACK routines.


