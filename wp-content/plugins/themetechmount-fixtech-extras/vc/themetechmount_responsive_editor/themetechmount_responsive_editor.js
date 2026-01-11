// Tab click event
jQuery('.tm-responsive-editor-tab-w a').on('click', function(){
	var parentmain = jQuery(this).closest('.themetechmount-responsive-editor-w');
	var size = jQuery(this).data('tm-size');
	
	// change tab active
	jQuery('.tm-responsive-editor-tab-w li', parentmain ).removeClass('tm-responsive-editor-tab-active');
	jQuery('.tm-responsive-editor-tab-w a[data-tm-size="'+size+'"]', parentmain ).parent().addClass('tm-responsive-editor-tab-active');
	
	// change content active
	jQuery('.themetechmount-responsive-editor', parentmain).slideUp();
	jQuery('.themetechmount-responsive-editor-'+size, parentmain).slideDown();
});


jQuery( ".themetechmount-responsive-editor-w input[type='text']:not(.tm-main-value-input), .themetechmount-responsive-editor-w input[type='checkbox']" ).on( 'change', function() {
	var parentmain = jQuery(this).closest('.themetechmount-responsive-editor-w');
	var mainval    = '';
	
	jQuery( "input[type='text']:not(.tm-main-value-input), input[type='checkbox']", parentmain ).each(function() {
		if( jQuery(this).attr('type')=='checkbox' ){
			if( jQuery(this).is(':checked') ){
				mainval += 'colbreak_yes|';
			} else {
				mainval += 'colbreak_no|';
			}
		} else {
			mainval += jQuery(this).val() + '|';
		}
	});
	
	jQuery('input.tm-main-value-input', parentmain ).val( mainval );
	
});