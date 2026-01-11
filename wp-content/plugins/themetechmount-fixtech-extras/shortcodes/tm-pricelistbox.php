<?php
// [tm-pricelistbox]
if( !function_exists('themetechmount_sc_pricelist') ){
function themetechmount_sc_pricelist( $atts, $content=NULL ){
	
	global $tm_vc_custom_element_pricelistbox;
	$options_list = themetechmount_create_options_list($tm_vc_custom_element_pricelistbox);
	
	extract( shortcode_atts(
		$options_list
	, $atts ) );
	
	
	$ctaShortcode = '[tm-heading ';
	foreach( $options_list as $key=>$val ){
		if( trim( ${$key} )!='' ){
			$ctaShortcode .= ' '.$key.'="'.${$key}.'" ';
		}
	}
	$ctaShortcode .= 'el_width="100%" css_animation=""][/tm-heading]';
	
	
	
	$return = do_shortcode($ctaShortcode);
	

	// pricelist lists
	$pricelist = json_decode(urldecode($pricelist));
	
	
	$return .= '<div class="tm-pricelist-block-wrapper">';
	$return .= '<ul class="tm-pricelist-block">';
		foreach( $pricelist as $data ){
			
			$service_name 	= '';
			$timing = '';
			
			//service_name 
			if( !empty($data->service_name) ){
				$servicename = ( isset($data->service_name) ) ? $data->service_name : '';
			}
			
			//price
			if( !empty($data->price) ){
				$price = ( isset($data->price) ) ? $data->price : '';
				$prices= '<span class="service-price">'.$price.'</span>';
			}
			
			$return .= '<li>'.$servicename.$prices.'</li>';
			
		}
	$return .= '</ul> <!-- .tm-pricelist-block -->';
	$return .= '</div><!-- .tm-pricelist-block-wrapper -->  ';
	

	$wrapperStart = '<div class="themetechmount-pricelistbox-wrapper '.$el_class.'">';
	$wrapperEnd   = '</div>';
	return $wrapperStart.$return.$wrapperEnd;
	
	
}
}
add_shortcode( 'tm-pricelistbox', 'themetechmount_sc_pricelist' );