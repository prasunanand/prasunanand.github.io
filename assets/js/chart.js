var app = angular.module('resultApp',[]);
var nmatrix_ruby, nmatrix_lapacke, nmatrix_jruby, arrayfire, arrayfire_lapacke;
app.controller('MainCtrl', function($scope, $http) {

  NmatrixUrl = "/assets/benchmarks/nmatrix-ruby.json"
  NMatrixJRubyUrl = "/assets/benchmarks/nmatrix-jruby.json"
  NMatrixLapackeRubyUrl = "/assets/benchmarks/nmatrix-lapacke.json"
  ArrayFireUrl = "/assets/benchmarks/arrayfire.json"
  ArrayFireLapackeUrl = "/assets/benchmarks/arrayfire-lapacke.json"



  $http.get(NmatrixUrl).success(function(data) {
    nmatrix_ruby = data;
    console.log(data['subtraction']);
    $http.get(NMatrixLapackeRubyUrl).success(function(data) {
      nmatrix_lapacke = data;
      $http.get(NMatrixJRubyUrl).success(function(data) {
        nmatrix_jruby = data;
        $http.get(ArrayFireUrl).success(function(data) {
          arrayfire = data;
          $http.get(ArrayFireLapackeUrl).success(function(data) {
            arrayfire_lapacke = data;

            console.log($scope.arith);

            $scope.arith = ["addition", "subtraction"];

            for (var i=0, l=  $scope.arith.length; i<l; i++){
              // console.log(key)
              key = $scope.arith[i];
              console.log(nmatrix_ruby);
              $(function () {
                $('#chart'+key).highcharts({
                    type: 'line',
                    title: {
                      text: 'Matrix '+key,
                      x: -20 //center
                    },
                    subtitle: {x: -20},
                    xAxis: {
                      title: {
                        text: 'Number of elements in one Matrix'
                      },
                    },
                    yAxis: {
                      title: {
                          text: 'Time (s)'
                      },
                      type: 'logarithmic',
                      plotLines: [{
                          value: 0,
                          width: 1,
                          color: '#808080'
                      }]
                    },
                    tooltip: {
                      valueSuffix: 's'
                    },
                    legend: {
                      layout: 'vertical',
                      align: 'right',
                      verticalAlign: 'middle',
                      borderWidth: 0
                    },
                    series: [{
                      name: "NMatrix-Ruby",
                      data: nmatrix_ruby[key],
                      color: 'black'
                    },{
                      name: "NMatrix-JRuby",
                      data: nmatrix_jruby[key],
                      color: 'green'
                    },{
                      name: "ArrayFire",
                      data: arrayfire[key],
                      color: 'orange'
                    },
                  ]
                });
              });
            }


            $(function () {
              $('#chartmat_mult').highcharts({
                  type: 'line',
                  title: {
                    text: 'Matrix '+ 'Multiplication',
                    x: -20 //center
                  },
                  subtitle: {x: -20},
                  xAxis: {
                    title: {
                      text: 'Number of elements in one Matrix'
                    },
                  },
                  yAxis: {
                    title: {
                        text: 'Time (s)'
                    },
                    type: 'logarithmic',
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                  },
                  tooltip: {
                    valueSuffix: 's'
                  },
                  legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle',
                    borderWidth: 0
                  },
                  series: [{
                    name: "NMatrix-BLAS-Ruby",
                    data: nmatrix_lapacke["mat_mult"],
                    color: 'red'
                  },{
                    name: "NMatrix-Ruby",
                    data: nmatrix_ruby["mat_mult"],
                    color: 'black'
                  },{
                    name: "NMatrix-JRuby",
                    data: nmatrix_jruby["mat_mult"],
                    color: 'green'
                  },{
                    name: "ArrayFire",
                    data: arrayfire["mat_mult"],
                    color: 'orange'
                  },
                ]
              });
            });


            $scope.lapack = ["determinant", "lu_factorization"];

            for (var i=0, l=  $scope.lapack.length; i<l; i++){
              // console.log(key)
              key = $scope.lapack[i];
              console.log(nmatrix_ruby);
              $(function () {
                $('#chart'+key).highcharts({
                    type: 'line',
                    title: {
                      text: 'Matrix '+key,
                      x: -20 //center
                    },
                    subtitle: {x: -20},
                    xAxis: {
                      title: {
                        text: 'Number of elements in one Matrix'
                      },
                    },
                    yAxis: {
                      title: {
                          text: 'Time (s)'
                      },
                      type: 'logarithmic',
                      plotLines: [{
                          value: 0,
                          width: 1,
                          color: '#808080'
                      }]
                    },
                    tooltip: {
                      valueSuffix: 's'
                    },
                    legend: {
                      layout: 'vertical',
                      align: 'right',
                      verticalAlign: 'middle',
                      borderWidth: 0
                    },
                    series: [{
                      name: "NMatrix-LAPACK-Ruby",
                      data: nmatrix_lapacke[key],
                      color: 'red'
                    },{
                      name: "NMatrix-JRuby",
                      data: nmatrix_jruby[key],
                      color: 'green'
                    },{
                      name: "ArrayFire",
                      data: arrayfire_lapacke[key],
                      color: 'orange'
                    },
                  ]
                });
              });
            }

          });
        });
      });
    });
  });
})
