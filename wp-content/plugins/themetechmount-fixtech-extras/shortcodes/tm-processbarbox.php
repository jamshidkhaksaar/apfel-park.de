<?php
// [tm-processbar]
if( !function_exists('themetechmount_sc_processbar') ){
function themetechmount_sc_processbar( $atts, $content=NULL ){
	
	$return = '';
	$hover_img = '';
		
		global $tm_vc_custom_element_processbarbox;
		$options_list = themetechmount_create_options_list($tm_vc_custom_element_processbarbox);
		
		
		extract( shortcode_atts(
			$options_list
		, $atts ) );
		

		$class   = array();
		$class[] = 'tm-elements-bgcolor-' . $box_bgcolor;
		$class[] = 'tm-' . $box_textcolor;
		$class = implode( ' ', $class );
		
		$return .= '<div class="tm-processbar-block-wrapper">';
		
		$total = 4;
		for( $i=1; $i <= $total ; $i++ ){
			
			if( trim(trim(${'label'.$i}))!='' ){				
				$label = rawurldecode(trim(${'label'.$i}));
				if( trim($label) != '' ){
					$prcess_labels= '<span>' . $label . '</span>';
				}				
			
				if( trim(trim(${'boximage'.$i}))!='' ){				
					$image = rawurldecode(trim(${'boximage'.$i}));
					$boximage = ( isset($image) ) ? wp_get_attachment_image( $image, 'thumb' ) : '';
					if( trim($boximage) != '' ){
						$hover_img= '<div class="process-img">' . $boximage . '</div>';
					}				
				}
				if( trim(trim(${'boximage'.$i}))=='' ){ $hover_img='';}
				
				$return .= '<div class="tm-process-content ' . themetechmount_sanitize_html_classes($class) . '">'.$prcess_labels.$hover_img.'</div>';
			}
		}
		
		
		$return .= '</div>';
		$wrapperStart = '<div class="themetechmount-processbar-wrapper-main"><div class="themetechmount-processbar-wrapper '.$el_class.'">';
		$wrapperEnd   = '</div></div>';
		return $wrapperStart.$return.$wrapperEnd;
		
}
}
add_shortcode( 'tm-processbar', 'themetechmount_sc_processbar' );