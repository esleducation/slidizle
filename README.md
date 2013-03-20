slidizle
========

jQuery plugin for creating custom slideshow

Settings
========

```javascript
// vars :
this.settings = {
  classes : {
		play 					: 'play',					// the play class applied on the container
		pause 		 			: 'pause',					// the pause class applied on the container
		stop 					: 'stop',					// the stop class applied on the container
		slider 					: 'slidizle',				// an class to access the slider
		active 					: 'active',					// the className to add to active navigation, etc...
		loading 				: 'loading'					// the className to add to the slider when it is in loading mode
	},
	timeout					: null,						// the slider interval time between each medias
	transition				: {							// save the transition options like duration, ease, etc...
		callback				: null,					// the name of the transition to use
		duration				: 1000,
		ease					: ''
	},
	pauseOnOver				: false,					// set if the slider has to make pause on hover
	autoPlay				: true,						// set if the slider has to play directly or not
	timerInterval			: 1000/30,					// save the interval for the timer refreshing
	onInit					: null,						// callback when the slider is inited
	onClick					: null,						// callback when a slide is clicked
	onChange				: null,						// callback when the slider change from one media to another
	onNext					: null,						// callback when the slider change for the next slide
	onPrevious				: null,						// callback when the slider change for the previous slide
	onPlay					: null,						// callback when the slider change his state to play
	onPause					: null,						// callback when the slider change his state to pause
	onTimer					: null						// callback when the slider timeout progress.
};
```
