// Animation
new WOW().init();


// Login Signup form slider
$(document).ready(function(){
	$('.login-sign-up-form-slider').owlCarousel({
	  margin: 40,
	  nav: false,
	  navText: ['<span class="material-icons">chevron_left</span>','<span class="material-icons">chevron_right</span>'],
	  loop: true,
	  dots: true,
	  center: false,
	  autoplay: false,
	  autoplayTimeout: 4000,
	  responsive: {
	    0: {
	      items: 1
	    },
	    768: {
	      items: 1
	    },
	    1199: {
	      items: 1
	    }
	  }
	});
});