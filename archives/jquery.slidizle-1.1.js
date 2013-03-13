/**
 * Slider jQuery Plugin
 *
 * This plugin allow to create sliders from images, video or html content.
 *
 * @author	Olivier Bossel (andes)
 * @created	21.02.2012
 * @updated 12.03.2013
 * @version	1.1
 */
;(function($) {
	
	/**
	 * Plugin :
	 */
	function slidizle(item, options) {
		
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
				callback				: 'fade',				// the name of the transition to use
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
		this.$refs = {
			slider					: null,						// save the reference to the slider container itself
			content					: null,						// save the reference to the content element
			medias					: null,						// save the references to all medias element
			navigation				: null,						// save the reference to the navigation element
			next					: null,						// save the reference to the next element
			previous				: null,						// save the reference to the previous media displayed
			current					: null,						// save the reference to the current media displayed
			timer 					: null						// save the reference to the timer element if exist
		};
		this.config = {
			native_transitions		: [							// list of native transitions
				'default', 'fade'
			]
		};
		this.current_timeout_time = 0;							// save the current time of the timeout
		this.timer = null;										// save the timeout used as timer
		this.timeout = null;									// save the timeout for playing slider
		this.previous_index = 0;								// save the index of the previous media displayed
		this.current_index = 0;									// save the index of the current media displayed
		this.isPlaying = false;									// save the playing state
		this.isOver = false;									// save the over state
		this.total = 0;											// save the total number of element in the slider				
		this.$this = $(item);									// save the jQuery item to access it
		
		// init :
		this.init($(item), options); 
		
	}
	
	/**
	 * Init : init the plugin
	 *
	 * @param	jQuery	item	The jQuery item
	 * @param	object	options	The options
	 */
	slidizle.prototype.init = function(item, options) {
		
		// vars :
		var _this = this,
			$this = item;
		
		// add bb-slider class if needed :
		if (!$this.hasClass(_this._getSetting('classes.slider'))) $this.addClass(_this._getSetting('classes.slider'));

		// update options :
		$.extend(true, _this.settings, options);

		// save all references :
		_this.$refs.slider = $this;
		_this.$refs.content = $this.find('[data-slidizle-content]');
		_this.$refs.navigation = $this.find('[data-slidizle-navigation]');
		_this.$refs.previous = $this.find('[data-slidizle-previous]');
		_this.$refs.next = $this.find('[data-slidizle-next]');
		_this.$refs.timer = $this.find('[data-slidizle-timer]');
		
		// get all medias in the slider :
		var content_childs_type = _this.$refs.content.children(':first-child')[0]['nodeName'].toLowerCase();
		_this.$refs.medias = _this.$refs.content.children(content_childs_type);
		
		// adding click on slides :
		_this.$refs.medias.click(function(e) {
			// trigger an event :
			$this.trigger('onClick',[_this]);
			// callback :
			if (_this._getSetting('onClick')) _this._getSetting('onClick')(_this);
		});
		
		// creating data :
		_this.total = _this.$refs.medias.length;
		_this.current_index = 0;
		
		// init navigation :
		if (_this.$refs.navigation.length>=1) _this._initNavigation();
		_this.initPreviousNextNavigation();
		
		// apply class :
		$this.addClass(_this._getSetting('classes.slider'));
		
		// hiding all medias :
		if (_this._getSetting('transition') && _this._isNativeTransition(_this._getSetting('transition.callback'))) _this.$refs.medias.hide();
		
		// check if a content is already active :
		var $active_slide = _this.$refs.medias.filter('.active:first');
		if ($active_slide.length >= 1) {
			// go to specific slide :
			_this.current_index = $active_slide.index();
		}
			
		// change medias for the first time :
		_this._changeMedias();	

		// check if pauseOnOver is set to true :
		if (_this._getSetting('pauseOnOver')) {
			// add hover listener :
			$this.hover(function(e) {
				// pause :
				_this.pause();
				// update isOver state :
				_this.isOver = true;
			}, function(e) {
				// play :
				_this.play();
				// update isOver state :
				_this.isOver = false;
			});
		}

		// play :
		if (_this._getSetting('autoPlay') && _this.$refs.medias.length > 1) _this.play();

		// check the on init :
		if (_this._getSetting('onInit')) _this._getSetting('onInit')(_this);
		
	}
	
	/**
	 * Creation of the navigation :
	 */
	slidizle.prototype._initNavigation = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// check if is an navigation tag :
		if (!_this.$refs.navigation) return false;
		
		// check if we have to popule the navigation :
		if (_this.$refs.navigation.children().length <= 0)
		{
			// determine how to populate the navigation :
			var navigation_type = _this.$refs.navigation[0]['nodeName'].toLowerCase(),
				navigation_children_type = (navigation_type == 'dl') ? 'dt' :
											(navigation_type == 'ol') ? 'li' :
											(navigation_type == 'ul') ? 'li' :
											'div';
			
			// create an navigation element for each media :
			for (var i=0; i<_this.total; i++)
			{
				// create an navigation element :
				_this.$refs.navigation.append('<'+navigation_children_type+'>'+(i+1)+'</'+navigation_children_type+'>');	
			}
		}
		
		// add click event on navigation :
		_this.$refs.navigation.children().bind('click', function(e) {
			
			// vars :
			var $nav = $(this),
				slide_id = $nav.attr('data-slidizle-slide-id'),
				content_by_slide_id = _this.$refs.medias.filter('[data-slidizle-slide-id="'+slide_id+'"]');

			// saving previous var :
			_this.previous_index = _this.current_index;

			// check if nav has an slide id :
			if (slide_id && content_by_slide_id)
			{
				// get index :
				var idx = content_by_slide_id.index();

				// check if index is not the same as now :
				if (idx != _this.current_index)
				{
					// updating current index :
					_this.current_index = idx;

					// change media :
					_this._changeMedias();
				}
			} else {
				// check if is not the same :
				if ($(this).index() != _this.current_index)
				{
					// updating current var :
					_this.current_index = $(this).index();
					
					// change media :
					_this._changeMedias();
				}
			}
			
			// prevent default behaviors :
			e.preventDefault();
		});
	}

	/**
	 * Init next and prev links :
	 */
	slidizle.prototype.initPreviousNextNavigation = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// add click event on previous tag :
		if (_this.$refs.previous)
		{	
			// add click handler :
			if (_this.total > 1) _this.$refs.previous.bind('click', function() { _this.previous(); });
			// hide if no multiple medias :
			if (_this.total <= 1) _this.$refs.previous.hide();
		}
		
		// add click event on next tag :
		if (_this.$refs.next)
		{
			// add click handler :
			if (_this.total > 1) _this.$refs.next.bind('click', function() { _this.next(); });
			// hide if no multiple medias :
			if (_this.total <= 1) _this.$refs.next.hide();
		}
	}

	/**
	 * Play :
	 */
	slidizle.prototype.play = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// remove the pause class :
		_this.$this.removeClass(_this._getSetting('classes.pause'));
		_this.$this.removeClass(_this._getSetting('classes.stop'));

		// check the status :
		if (!_this.isPlaying && _this._getSetting('timeout') && _this.$refs.medias.length > 1) {
			// update the state :
			_this.isPlaying = true;
			// check the current_timeout_time :
			if (_this.current_timeout_time <= 0) {
				// reset the timeout :
				var t = _this.$refs.current.data('slide-timeout') || _this._getSetting('timeout');
				if (t) {
					_this.current_timeout_time = t;
				}
			}
			// start the timer :
			clearInterval(_this.timer);
			_this.timer = setInterval(function() {
				_this._tick();
			}, _this._getSetting('timerInterval'));
			// add the play class :
			_this.$this.addClass(_this._getSetting('classes.play'));
			// trigger callback :
			if (_this._getSetting('onPlay')) _this._getSetting('onPlay')(_this);
		}
	}

	/**
	 * Pause :
	 */
	slidizle.prototype.pause = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// remove the play class :
		_this.$this.removeClass(_this._getSetting('classes.play'));
		_this.$this.removeClass(_this._getSetting('classes.stop'));

		// check the status :
		if (_this.isPlaying) {
			// update the state :
			_this.isPlaying = false;
			// stop the timer :
			clearInterval(_this.timer);
			// add the pause class :
			_this.$this.addClass(_this._getSetting('classes.pause'));
			// trigger callback :
			if (_this._getSetting('onPause')) _this._getSetting('onPause')(_this);
		}
	}

	/**
	 * Stop :
	 * Stop timer and reset it 
	 */
	slidizle.prototype.stop = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// remove the play and pause class :
		_this.$this.removeClass(_this._getSetting('classes.play'));
		_this.$this.removeClass(_this._getSetting('classes.pause'));

		// check the status :
		if (_this.isPlaying) {
			// update the state :
			_this.isPlaying = false;
			// stop the timer :
			clearInterval(_this.timer);
			// reset the timer :
			var t = _this.$refs.current.data('slide-timeout') || _this._getSetting('timeout');
			_this.current_timeout_time = t;
			// call onTimer if exist :
			if (_this._getSetting('onTimer')) _this._getSetting('onTimer')(_this, _this.current_timeout_time, t);
			// add the pause class :
			_this.$this.addClass(_this._getSetting('classes.stop'));
			// trigger callback :
			if (_this._getSetting('onStop')) _this._getSetting('onStop')(_this);
		}
	}

	/**
	 * Toggle play pause :
	 */
	slidizle.prototype.togglePlayPause = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// check the status :
		if (_this.isPlaying) _this.pause();
		else _this.play();
	}
	
	/**
	 * Next media :
	 */
	slidizle.prototype.next = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
				
		// saving previous :
		_this.previous_index = _this.current_index;
		
		// managing current :
		_this.current_index = (_this.current_index+1 < _this.total) ? _this.current_index+1 : 0;
		
		// change medias :
		_this._changeMedias();
	}
			
	/**
	 * Previous media :
	 */
	slidizle.prototype.previous = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// saving previous :
		_this.previous_index = _this.current_index;
		
		// managing current :
		_this.current_index = (_this.current_index-1 < 0) ? _this.total-1 : _this.current_index-1;
		
		// change medias :
		_this._changeMedias();
	}

	/**
	 * Go to a specific slide :
	 *
	 * @param 	String|int 	ref 	The slide reference (can be an index(int) or a string (class or id))
	 */
	slidizle.prototype.gotoSlide = function(ref)
	{
		// vars :
		var _this = this,
			$this = _this.$this,
			$slide = null;

		// check the ref :
		if (typeof ref == 'string') {
			// check if is an selector specified :
			if (ref.substr(0,1) == '.' || ref.substr(0,1) == '#') {
				// try to find the slide by selector :
				$slide = _this.$refs.content.children(ref);
			} else {
				// check if we can find an slide ref :
				if (_this.$refs.content.children('[data-slide-ref="'+ref+'"]').length == 1) {
					$slide = _this.$refs.content.children('[data-slide-ref="'+ref+'"]');
				} else if (_this.$refs.content.children('#'+ref).length == 1) {
					$slide = _this.$refs.content.children('#'+ref);
				}
			}
		} else if (typeof ref == 'number') {
			// get the slide :
			$slide = _this.$refs.content.children(':eq('+ref+')');
		}

		// try to get the index of the slide :
		if ($slide && $slide.index() != null) {
			// set the current index :
			_this.current_index = $slide.index();
			// change media :
			_this._changeMedias();
		}
	}

	/**
	 * Go to and play :
	 *
	 * @param 	String|int 	ref 	The slide reference (can be an index(int) or a string (class or id))
	 */
	slidizle.prototype.gotoAndPlay = function(ref)
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// go to a slide :
		_this.gotoSlide(ref);

		// play :
		_this.play();
	},

	/**
	 * Go to and stop :
	 *
	 * @param 	String|int 	ref 	The slide reference (can be an index(int) or a string (class or id))
	 */
	slidizle.prototype.gotoAndStop = function(ref)
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// go to a slide :
		_this.gotoSlide(ref);

		// play :
		_this.stop();
	},

	/**
	 * tick tick tick...
	 */
	slidizle.prototype._tick = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;

		// update current timeout time :
		_this.current_timeout_time -= _this._getSetting('timerInterval');

		// call the onTimer callback :
		if (_this._getSetting('onTimer')) {
			var total_timeout = _this.$refs.current.data('slide-timeout') || _this._getSetting('timeout');
			_this._getSetting('onTimer')(_this, _this.current_timeout_time, total_timeout);
		}

		// check current timeout time :
		if (_this.current_timeout_time <= 0) {
			// change media :
			_this.next();
		}
	}
			
	/**
	 * Managing the media change :
	 */
	slidizle.prototype._changeMedias = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
			
		// clear timer (relaunchec on transition) :
		clearInterval(_this.timer);
		_this.timer = null;

		// save the reference to the previous media displayed :
		_this.$refs.previous = _this.$refs.current;
	
		// save the reference to the current media displayed :
		_this.$refs.current = _this.$refs.content.children(':eq('+_this.current_index+')');

		// managing active class on the navigation :
		var current_slide_id = _this.$refs.current.attr('data-slidizle-slide-id'),
			current_navigation_by_slide_id = _this.$refs.navigation.children('[data-slidizle-slide-id="'+current_slide_id+'"]');
		if (current_slide_id && current_navigation_by_slide_id)
		{
			_this.$refs.navigation.children().removeClass(_this._getSetting('classes.active'));
			current_navigation_by_slide_id.addClass(_this._getSetting('classes.active'));
		} else {
			_this.$refs.navigation.children().removeClass(_this._getSetting('classes.active'));
			_this.$refs.navigation.children(':eq('+_this.current_index+')').addClass(_this._getSetting('classes.active'));
		}

		// reset the timeout :
		var t = _this.$refs.current.data('slide-timeout') || _this._getSetting('timeout');
		if (t) {
			_this.current_timeout_time = t;
		}

		// call the onTimer callback if exist :
		if (_this._getSetting('onTimer') && _this._getSetting('timeout')) _this._getSetting('onTimer')(_this, _this.current_timeout_time, t);

		// remove the class of the current media on the container :
		if (_this.$refs.previous) _this.$this.removeClass('slide-'+_this.$refs.previous.index());

		// set the class of the current media on the container :
		_this.$this.addClass('slide-'+_this.$refs.current.index());

		// add the loading clas to the slider :
		_this.$refs.slider.addClass(_this._getSetting('classes.loading'));
		
		// load all images into content if is some :
		if (_this.$refs.current.find('img').length>0)
		{
			// count images :
			var $images =  _this.$refs.current.find('img'),
				total_images = $images.length,
				total_loaded = 0;
			
			// add load event on each image :
			$images.each(function() {
				// managing image src to fire correctly the load event :
				var random = '?random='+Math.round(Math.random()*9999999999).toString(),
					src = ($(this).data('src')) ? $(this).data('src') : $(this).attr('src');
				$(this).removeAttr('src');
				if (navigator.userAgent.match(/MSIE/gi)) $(this).attr('src', src+random);
				else $(this).attr('src', src);
				// wait for the load event :
				$(this).one('load', function() {
					// update total loaded var :
					total_loaded++;
					// check if all images have been loaded :
					if (total_loaded == total_images) {
						// remove loading class :
						_this.$refs.slider.removeClass(_this._getSetting('classes.loading'));
						
						// launch transition :
						launchTransition();
						
						// trigger an load event for each images after transition launch to
						// have access to load handler on images in change event of the api :
						$images.each(function() {
							$(this).trigger('load');
						});
					}
				});
			});
		} else {
			// remove loading class :
			_this.$refs.slider.removeClass(_this._getSetting('classes.loading'));
		
			// launch directly the transition :
			launchTransition();
		}
		
		// launch transition and dispatch en change event :
		function launchTransition()
		{
			// delete active_class before change :
			_this.$refs.medias.removeClass(_this._getSetting('classes.active'));

			// delete active_class before change :
			_this.$refs.current.addClass(_this._getSetting('classes.active'));

			// check transition type :
			if (_this._getSetting('transition') && _this._isNativeTransition(_this._getSetting('transition.callback'))) _this._transition(_this._getSetting('transition.callback'));
			else if (_this._getSetting('transition') && _this._getSetting('transition.callback')) _this._getSetting('transition.callback')(_this);
			
			// callback :
			if (_this._getSetting('onChange')) _this._getSetting('onChange')(_this);

			// check if the current if greater than the previous :
			if (_this.$refs.current.index() == 0 && _this.$refs.previous)
			{
				if (_this.$refs.previous.index() == _this.$refs.medias.length-1 && _this._getSetting('onNext')) _this._getSetting('onNext')(_this);
				else if (_this._getSetting('onPrevious')) _this._getSetting('onPrevious')(_this);
			} else if (_this.$refs.current.index() == _this.$refs.medias.length-1 && _this.$refs.previous)
			{
				if (_this.$refs.previous.index() == 0 && _this._getSetting('onPrevious')) _this._getSetting('onPrevious')(_this);
				else if (_this._getSetting('onNext')) _this._getSetting('onNext')(_this);
			} else if (_this.$refs.previous) {
				if (_this.$refs.current.index() > _this.$refs.previous.index() && _this._getSetting('onNext')) _this._getSetting('onNext')(_this);
				else if (_this._getSetting('onPrevious')) _this._getSetting('onPrevious')(_this);
			} else {
				if (_this._getSetting('onNext')) _this._getSetting('onNext')(_this);
			}

			// init the timer :
			if (_this._getSetting('timeout') && _this.$refs.medias.length > 1 && _this.isPlaying && !_this.timer) {
				_this.timer = setInterval(function() {
					_this._tick();
				}, _this._getSetting('timerInterval'));
			}
		}
	}
			
	/**
	 * Execute an native transition :
	 *
	 * @param	String	transition	The transition to operate
	 */
	slidizle.prototype._transition = function(transition)
	{
		// vars :
		var _this = this,
			$this = _this.$this;
	
		// get previous and current item :
		var previous = _this.$refs.previous,
			current = _this.$refs.current;
		
		// switch on transition name :
		switch (transition)
		{
			case 'fade':
				// hide previous :
				if (previous) {
					previous.clearQueue().animate({
						opacity:0
					}, 400, function() {
						// hide :
						$(this).css('display','none');
					});
				}
				
				// display current :
				if (current) {
					current.css({
						opacity:0,
						display:'block'
					}).clearQueue().animate({
						opacity:1
					}, 400);
				}	
			break;
			case 'default':
			default:
				// hide previous :
				if (previous) previous.hide();
				// display current :
				current.show();
			break;
		}
	}
			
	/**
	 * Check if the given transition exist in native mode
	 *
	 * @param	String	$transition	The transition to check
	 * @return	Boolean	true if exist, false it not
	 */
	slidizle.prototype._isNativeTransition = function(transition)
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// loop on each native transition :
		for(var i=0; i<_this.config.native_transitions.length; i++) {
			// check if is this transition :
			if (transition == _this.config.native_transitions[i]) return true;
		}
		
		// this is not an native transition :
		return false;
	}
			
	/**
	 * Get slider height :
	 *
	 * @return	number	slider height
	 */
	slidizle.prototype.getHeight = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// return slider height :
		return parseInt(_this.$refs.slider.height());
	}
	
	/**
	 * Get slider width :
	 *
	 * @return	number	slider width
	 */
	slidizle.prototype.getWidth = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// return slider height :
		return parseInt(_this.$refs.slider.width());
	}
	
	/**
	 * Get current media :
	 *
	 * @return	jQuery Object	The current media reference
	 */
	slidizle.prototype.getCurrentMedia = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// return the current media reference :
		return _this.$refs.current;
	}
	
	/**
	 * Get all medias :
	 *
	 * @return	jQuery Object	All medias references
	 */
	slidizle.prototype.getAllMedias = function()
	{
		// vars :
		var _this = this,
			$this = _this.$this;
		
		// return all medias :
		return _this.$refs.medias;
	}
	
	/**
	 * Get setting :
	 * this function try to get the setting asked on the html tag itself
	 * the name has to be a string separated by the "." -> classes.loading
	 * this function will check if data-{pluginName}-classes-loading attr ecist and return it, or return the _this._getSetting('classes.loading value if not
	 *
	 * @param 	string 	name 	The name of the setting to get (use dot notation) (ex : classes.loading)
	 */
	slidizle.prototype._getSetting = function(name) {

		// vars :
		var _this = this,
			$this = _this.$this;

		// split the setting name :
		var inline_setting = 'data-slidizle-' + name.replace('.','-'),
			inline_attr = $this.attr(inline_setting);

		// check if element has inline setting :
		if (typeof inline_attr !== 'undefined' && inline_attr !== false) return inline_attr;
		else return eval('_this.settings.'+name);
	};

	/**
	 * Expose API :
	 */
	var methods = {
		
		/**
		 * Init :
		 */
		init : function(options) {
			return this.each(function() {
				// init plugin :
				var p = new slidizle(this, options);
				// save plugin :
				$(this).data('slidizle', p);
			});	
		},
		
		/**
		 * Next slide :
		 */
		next : function() {
			return this.each(function() {
				// call on plugin :
				plugin_call(this, 'next');
			});
		},
		
		/**
		 * Previous slide :
		 */
		previous : function() {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'previous');
			});
		},

		/**
		 * Play :
		 */
		play : function() {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'play');
			})
		},

		/**
		 * Pause :
		 */
		pause : function() {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'pause');
			})
		},

		/**
		 * Stop :
		 */
		stop : function() {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'stop');
			});
		},

		/**
		 * Toggle play/pause :
		 */
		togglePlayPause : function() {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'togglePlayPause');
			})
		},

		/**
		 * Go to a specific slide :
		 */
		gotoSlide : function(ref) {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'gotoSlide', ref);
			});
		},

		/**
		 * Go to and play :
		 */
		gotoAndPlay : function(ref) {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'gotoAndPlay', ref);
			});
		},

		/**
		 * Go to and stop :
		 */
		gotoAndStop : function(ref) {
			return this.each(function() {
				// call in plugin :
				plugin_call(this, 'gotoAndStop', ref);
			});
		}
		
	};
	
	/**
	 * Call methods on plugin :
	 */
	function plugin_call(ref, method)
	{
		// get plugin :
		var plugin = $(ref).data('slidizle');
		// check plugin :
		if (plugin) {
			// call into plugin :
			return plugin[method].apply( plugin, Array.prototype.slice.call( arguments, 2 ));
		}
	}
	 
	/**
	 * jQuery bb_counter controller :
	 */
	$.fn.slidizle = function(method) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.slidizle' );
		}    
	}

})(jQuery);