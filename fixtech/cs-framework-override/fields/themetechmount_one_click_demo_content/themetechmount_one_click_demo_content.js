jQuery( document ).ready(function($) {

	jQuery( '#themetechmount_one_click_demo_content_btn, .tm-one-click-error-close' ).on('click', function() {
		
		if( !jQuery(this).hasClass('disabled') ){
			if( jQuery( '#import-demo-data-results-wrapper' ).css('display') == 'none' ){
				jQuery( '#import-demo-data-results-wrapper' ).slideDown();
				jQuery( '#themetechmount_one_click_demo_content_btn' ).addClass('disabled');
			} else {
				jQuery( '#import-demo-data-results-wrapper' ).slideUp();
				jQuery( '#themetechmount_one_click_demo_content_btn' ).removeClass('disabled');
			}
		}
		
		return false;
	});
	
	
});