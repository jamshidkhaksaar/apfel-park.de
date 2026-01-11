function themetechmount_style_selector_click(){
	jQuery('.tm-styleselector-thumb').each(function(){
		var $this = jQuery(this);
		
		jQuery($this).on( 'click', function(){
			var currval = jQuery(this).data('value');
			var wrapper = jQuery(this).closest('.tm-styleselector-main-wrapper');
			
			jQuery( '.tm-styleselector-thumb', wrapper).removeClass('tm-styleselector-thumb-selected');
			jQuery( '.tm-styleselector-thumb-'+currval, wrapper).addClass('tm-styleselector-thumb-selected');
			
			jQuery( 'select', wrapper).val(currval).trigger('change');
			
			
		});
		
	});

};
themetechmount_style_selector_click();