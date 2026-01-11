jQuery( document ).ready(function($) {
	
	
	
	// Remove query string from URL
	var currurl = window.location.href;
	if (currurl.indexOf('tmdemosuccess=yes') > -1) {
		currurl = currurl.replace('&tmdemosuccess=yes', '');
		window.history.pushState( {urlPath:currurl} , 'Fixtech Options < Fixtech - WordPress', currurl );
	}
	
	
	
	
	
	// On change the dropdown to select the demo client like to import 
	jQuery( "#import-layout-type" ).change(function() {
		var selected = jQuery(this).val().toLowerCase().replace(' ', '-');
		jQuery('.import-demo-thumb-w').css('display','none');
		jQuery( '.import-demo-thumb-'+selected ).css('display','inline-block');
	});
	
	
	jQuery('.themetechmount-one-click-demo-content-wrapper').each(function(){
		
		var thisWrapper = jQuery(this);
		
		/*** Ajax process ***/
		jQuery('#themetechmount_one_click_demo_content').on('click', function() {
			
			if( $(this).attr('disabled') == 'disabled' ) {
				return false;
			}
			
			$(this).attr('disabled', 'disabled');
			$('#import-layout-type').prop('disabled', 'disabled');
			
			var button = $(this);
			var resultDiv = $('.import-demo-data-text');
			
			resultDiv.addClass('themetechmount-import-demo-progress'); /* Adding loader class */
			
			// Layout Type
			var layout_type		 = '';
			var layout_type_name = '';
			if( jQuery('#import-layout-type').length>0 && jQuery('#import-layout-type').val()!='' ){
				layout_type_name = jQuery('#import-layout-type').val();
				layout_type		 = jQuery('#import-layout-type').val().toLowerCase().replace(' ', '-');
			}
			
		
			$.ajax({
				url: ajaxurl,
				type: "POST",
				dataType: "json",
				data: {
					'action'		: 'fixtech_install_demo_data',
					'layout_type'	: layout_type,
					'subaction'		: 'start'
				},
				beforeSend: function() {
					resultDiv.html('<p id="install-demo-data-started">Starting <strong>'+layout_type_name+'</strong> Demo Content Setup</p>').show().removeClass('error');
				},
				success: function( result ) {
					function demoInstallerStep( result ) {
						
						if( result != null && typeof( result ) == 'object' ) {
						
							if( result.answer == 'ok' ) {
							
								resultDiv.append('<p>' + result.message + '</p>');
								
								/*** Extra data for next processing ***/
								var missing_menu_items = '';
								if( typeof result.missing_menu_items != "undefined" ){
									missing_menu_items = result.missing_menu_items;
								}
								
								var processed_terms = '';
								if( typeof result.processed_terms != "undefined" ){
									processed_terms = result.processed_terms;
								}
								
								var processed_posts = '';
								if( typeof result.processed_posts != "undefined" ){
									processed_posts = result.processed_posts;
								}
								
								var processed_menu_items = '';
								if( typeof result.processed_menu_items != "undefined" ){
									processed_menu_items = result.processed_menu_items;
								}
								
								var menu_item_orphans = '';
								if( typeof result.menu_item_orphans != "undefined" ){
									menu_item_orphans = result.menu_item_orphans;
								}
								
								var url_remap = '';
								if( typeof result.url_remap != "undefined" ){
									url_remap = result.url_remap;
								}
								
								var featured_images = '';
								if( typeof result.featured_images != "undefined" ){
									featured_images = result.featured_images;
								}
								/***********************************/
								
								
								
								
								$.ajax({
									url: ajaxurl,
									type: "POST",
									dataType: "json",
									data: {
										'action'		: 'fixtech_install_demo_data',
										'layout_type'	: layout_type,
										'subaction'		: result.next_subaction,
										'data'			: result.data,
										'missing_menu_items'   : result.missing_menu_items,
										'processed_terms'      : result.processed_terms,
										'processed_posts'      : result.processed_posts,
										'processed_menu_items' : result.processed_menu_items,
										'menu_item_orphans'    : result.menu_item_orphans,
										'url_remap'            : result.url_remap,
										'featured_images'      : featured_images
									},
									success: function( result ) {
										demoInstallerStep( result );
									},
									error: function(request, status, error) {
										resultDiv.html( '<p><strong style="color: red"> Error: ' + request.status + '</p>' );
										button.removeAttr('disabled');
									}
								});
							
							}
						
							if( result.answer == 'finished' ) {
								
								
								if( result.reload == 'yes' ){
									resultDiv.append('<p><strong>All finished :) ... Please wait while we are saving the settings... </strong></p>');
									window.location = window.location.href + '&tmdemosuccess=yes';
								} else {
									resultDiv.append('<p><strong>All finished... Enjoy :)</strong></p>');
								}
							}
						
						} else {
						
							resultDiv.append( '<p><strong style="color: red">' + fixtechVars.strError + ":</strong> " + fixtechVars.strWrongServerAnswer + '</p>' ).addClass('error');
							button.removeAttr('disabled');
							$('#install-demo-data-started').remove();
							
						}
						
					}

					demoInstallerStep( result );
			
				},
				error: function(request, status, error) {
					resultDiv.html( '<p><strong style="color: red">: ERROR ' + request.status + '</p>' );
					button.removeAttr('disabled');
				}
			});
			
			return false;
		

		});
		
		
		
	});
	
	
}); // document.ready END