<?php

/**** Security ****/
if ( ! defined( 'ABSPATH' ) ) { die( '-1' ); }

/**
 * Adding extra parameters in VC
 */
if( !function_exists('themetechmount_vc_add_extra_param') ){
function themetechmount_vc_add_extra_param(){
	
	// VC ROW : Text Color
	vc_add_param( 'vc_row', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Text Color", "fixtech"),
		"description" => esc_attr__("Select text color.", "fixtech"),
		"param_name"  => "tm_textcolor",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("Default", "fixtech")     => "",
			esc_attr__("Dark Color", "fixtech")  => "dark",
			esc_attr__("White Color", "fixtech") => "white",
			esc_attr__("Skin Color", "fixtech")  => "skincolor",
		),
	));
	
	// VC ROW : Background Color
	vc_add_param( 'vc_row', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Background Color", "fixtech"),
		"description" => esc_attr__("Select Background Color. If you select color and also select background Video or background Image than the color will be overlay with some opacity.", "fixtech"),
		"param_name"  => "tm_bgcolor",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("Default (From Design Options tab)", "fixtech") => "",
			esc_attr__('Dark grey color as background color', 'fixtech') => 'darkgrey',
			esc_attr__('Grey color as background color', 'fixtech')      => 'grey',
			esc_attr__('White color as background color', 'fixtech')     => 'white',
			esc_attr__('Skincolor color as background color', 'fixtech') => 'skincolor',
			
		),
	));
	
	// VC ROW : Background Image Position
	vc_add_param( 'vc_row', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Background Image Position", "fixtech"),
		"description" => esc_attr__("Select Background Image Position", "fixtech"),
		"param_name"  => "tm_bgimage_position",
		"weight"      => 1,
		"value"       => array(
			esc_attr__('left top', "fixtech")      => 'left_top',
			esc_attr__('left center', "fixtech")   => 'left_center',
			esc_attr__('left bottom', "fixtech")   => 'left_bottom',
			esc_attr__('right top', "fixtech")     => 'right_top',
			esc_attr__('right center', "fixtech")  => 'right_center',
			esc_attr__('right bottom', "fixtech")  => 'right_bottom',
			esc_attr__('center center', "fixtech") => 'center_center',
			esc_attr__('center top', "fixtech")    => 'center_top',
			esc_attr__('center bottom', "fixtech") => 'center_bottom'
		),
		"std"  => "center_center",
	));
	
	// VC ROW : Fixed Background Image
	vc_add_param( 'vc_row', array(
		"type"        => "checkbox",
		"heading"     => esc_attr__("Fix Background Image", "fixtech"),
		"description" => esc_attr__("If checked, background image display fixed", "fixtech"),
		"param_name"  => "tm_bgimagefixed",
		"weight"      => 1,
		"std"  => "false",
	));
	
	// VC ROW : Break column in Tablet
	vc_add_param( 'vc_row', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Break column in Responsive", "fixtech"),
		"description" => esc_attr__("Break columns (set in one row) in Desktop or Tablet screens. This is useful if your content breaks (or not fit) due to wider content in columns.", "fixtech"),
		"param_name"  => "break_in_responsive",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("None (default)", "fixtech")									=> "",
			esc_attr__('Break in small desktop (under 1200 pixel size)', "fixtech")	=> '1200',
			esc_attr__('Break in tablet (under 992 pixel size)', "fixtech")			=> '991',
		),
	));
	
	// VC ROW : Add Shadow effect
	vc_add_param( 'vc_row', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Add shadow?", "fixtech"),
		"description" => esc_attr__("Select YES to set shadow for the column.", "fixtech"),
		"param_name"  => "tm_shadow",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("No", "fixtech")  => "",
			esc_attr__('Yes', 'fixtech') => 'yes',
		),
	));
	
	// VC ROW : Z-index
	vc_add_param( 'vc_row', array(
		'type'			=> 'themetechmount_style_selector',
		'heading'		=> esc_attr__( 'Section position of this ROW (z-index of the ROW)', 'fixtech' ),
		'description'	=> esc_attr__( 'Select position of this ROW. This will add z-index css property to row. So you can overlap ROW on each over by setting this z-index css property.', 'fixtech' ),
		'param_name'	=> 'tm_zindex',
		"weight"      	=> 1,
		'std'			=> 'zero',
		'value'			=> array(
			array(
				'label'	=> esc_attr('Z-Index- Style 0','fixtech'),
				'value'	=> 'zero',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-0.jpg',
				'width'	=> '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 1','fixtech'),
				'value'	=> '1',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-1.jpg',
				'width' => '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 2','fixtech'),
				'value'	=> '2',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-2.jpg',
				'width' => '120px',
			),
		),
	));
	
	// VC ROW : Responsive css settings
	vc_add_param( 'vc_row', themetechmount_responsive_padding_margin_option() );
	
	// VC COLUMN : Text Color
	vc_add_param( 'vc_column', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Text Color", "fixtech"),
		"description" => esc_attr__("Select text color", "fixtech"),
		"param_name"  => "tm_textcolor",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("Default", "fixtech")     => "",
			esc_attr__("Dark Color", "fixtech")  => "dark",
			esc_attr__("White Color", "fixtech") => "white",
			esc_attr__("Skin Color", "fixtech")  => "skincolor",
		),
	));
	
	// VC COLUMN : Background Color
	vc_add_param( 'vc_column', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Background Color", "fixtech"),
		"description" => esc_attr__("Select Background Color. If you select color and also select background Image than the color will be overlay with some opacity", "fixtech"),
		"param_name"  => "tm_bgcolor",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("Default (From Design Options tab)", "fixtech") => "",
			esc_attr__('Dark grey color as background color', 'fixtech') => 'darkgrey',
			esc_attr__('Grey color as background color', 'fixtech')      => 'grey',
			esc_attr__('White color as background color', 'fixtech')     => 'white',
			esc_attr__('Skincolor color as background color', 'fixtech') => 'skincolor',
			
		),
	));
	
	// VC COLUMN : Lower padding in responsive mode
	vc_add_param( 'vc_column', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Reduce spacing (Padding) from left/right area in responsive mode", "fixtech"),
		"description" => esc_attr__("This is useful if you set extra padding via 'Design Options' tab. This will reset spacing (padding) from left/right area for the column.", "fixtech"),
		"param_name"  => "reduce_extra_padding",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("None (default)", "fixtech")                       		   => "",
			esc_attr__('Reset in small desktop (under 1200 pixel size)', "fixtech") => '1200',
			esc_attr__('Reset in tablet (under 992 pixel size)', "fixtech")         => '991',
		),
	));
	
	// VC COLUMN : Exapand Column BG to left or right
	vc_add_param( 'vc_column', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Exapand Column Background", "fixtech"),
		"description" => esc_attr__("Exapand Column BG to left or right. This will expand the Background image/color visibility to border of the browser border.", "fixtech"),
		"param_name"  => "tm_col_bg_expand",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("No expand (default)", "fixtech")                => "",
			esc_attr__('Exapand Column background to left', 'fixtech')  => 'left',
			esc_attr__('Exapand Column background to right', 'fixtech') => 'right',
		),
	));
	
	vc_add_param( 'vc_column', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Background Image Position", "fixtech"),
		"description" => esc_attr__("Select Background Image Position", "fixtech"),
		"param_name"  => "tm_bgimage_position",
		"weight"      => 1,
		"value"       => array(
			esc_attr__('left top', "fixtech")      => 'left_top',
			esc_attr__('left center', "fixtech")   => 'left_center',
			esc_attr__('left bottom', "fixtech")   => 'left_bottom',
			esc_attr__('right top', "fixtech")     => 'right_top',
			esc_attr__('right center', "fixtech")  => 'right_center',
			esc_attr__('right bottom', "fixtech")  => 'right_bottom',
			esc_attr__('center center', "fixtech") => 'center_center',
			esc_attr__('center top', "fixtech")    => 'center_top',
			esc_attr__('center bottom', "fixtech") => 'center_bottom'
		),
		"std"  => "center_center",
	));
	
	// VC Column : Add Shadow
	vc_add_param( 'vc_column', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Add shadow?", "fixtech"),
		"description" => esc_attr__("Select YES to set shadow for the column.", "fixtech"),
		"param_name"  => "tm_shadow",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("No", "fixtech")  => "",
			esc_attr__('Yes', 'fixtech') => 'yes',
		),
	));
	
	// VC COLUMN : Z-index
	vc_add_param( 'vc_column', array(
		'type'			=> 'themetechmount_style_selector',
		'heading'		=> esc_attr__( 'Section position of this COLUMN (z-index of the COLUMN)', 'fixtech' ),
		'description'	=> esc_attr__( 'Select position of this COLUMN. This will add z-index css property to column. So you can overlap COLUMN on each over by setting z-index css property.', 'fixtech' ),
		'param_name'	=> 'tm_zindex',
		'std'			=> 'zero',
		"weight"      	=> 1,
		'value'			=> array(
			array(
				'label'	=> esc_attr('Z-Index- Style 0','fixtech'),
				'value'	=> 'zero',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-0.jpg',
				'width'	=> '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 1','fixtech'),
				'value'	=> '1',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-1.jpg',
				'width' => '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 2','fixtech'),
				'value'	=> '2',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-2.jpg',
				'width' => '120px',
			),
		),
	));
		
	// VC COLUMN : Responsive css settings
	vc_add_param( 'vc_column', themetechmount_responsive_padding_margin_option('column') );
	
	// VC ROW INNER : Break column in Tablet
	vc_add_param( 'vc_row_inner', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Break column in Responsive", "fixtech"),
		"description" => esc_attr__("Break columns (set in one row) in Desktop or Tablet screens. This is useful if your content breaks (or not fit) due to wider content in columns.", "fixtech"),
		"param_name"  => "break_in_responsive",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("None (default)", "fixtech")									=> "",
			esc_attr__('Break in small desktop (under 1200 pixel size)', "fixtech")	=> '1200',
			esc_attr__('Break in tablet (under 992 pixel size)', "fixtech")			=> '991',
		),
	));
	
	// VC ROW INNER : Add Shadow
	vc_add_param( 'vc_row_inner', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Add shadow?", "fixtech"),
		"description" => esc_attr__("Select YES to set shadow for the column.", "fixtech"),
		"param_name"  => "tm_shadow",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("No", "fixtech")  => "",
			esc_attr__('Yes', 'fixtech') => 'yes',
		),
	));
	
	// VC ROW : Z-index
	vc_add_param( 'vc_row_inner', array(
		'type'			=> 'themetechmount_style_selector',
		'heading'		=> esc_attr__( 'Section position of this ROW (z-index of the ROW)', 'fixtech' ),
		'description'	=> esc_attr__( 'Select position of this ROW. This will add z-index css property to row. So you can overlap ROW on each over by setting this z-index css property.', 'fixtech' ),
		'param_name'	=> 'tm_zindex',
		'std'			=> 'zero',
		"weight"      	=> 1,
		'value'			=> array(
			array(
				'label'	=> esc_attr('Z-Index- Style 0','fixtech'),
				'value'	=> 'zero',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-0.jpg',
				'width'	=> '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 1','fixtech'),
				'value'	=> '1',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-1.jpg',
				'width' => '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 2','fixtech'),
				'value'	=> '2',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-2.jpg',
				'width' => '120px',
			),
		),
	));
	
	// VC ROW INNER : Responsive css settings
	vc_add_param( 'vc_row_inner', themetechmount_responsive_padding_margin_option() );
	
	// VC COLUMN INNER : Text Color
	vc_add_param( 'vc_column_inner', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Text Color", "fixtech"),
		"description" => esc_attr__("Select text color", "fixtech"),
		"param_name"  => "tm_textcolor",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("Default", "fixtech")     => "",
			esc_attr__("Dark Color", "fixtech")  => "dark",
			esc_attr__("White Color", "fixtech") => "white",
			esc_attr__("Skin Color", "fixtech")  => "skincolor",
		),
	));
	
	// VC COLUMN INNER : Background Color
	vc_add_param( 'vc_column_inner', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Background Color", "fixtech"),
		"description" => esc_attr__("Select Background Color. If you select color and also select background Image than the color will be overlay with some opacity", "fixtech"),
		"param_name"  => "tm_bgcolor",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("Default (From Design Options tab)", "fixtech") => "",
			esc_attr__('Dark grey color as background color', 'fixtech') => 'darkgrey',
			esc_attr__('Grey color as background color', 'fixtech')      => 'grey',
			esc_attr__('White color as background color', 'fixtech')     => 'white',
			esc_attr__('Skincolor color as background color', 'fixtech') => 'skincolor',
			
		),
	));
	
	// VC COLUMN INNER : Lower padding in responsive mode
	vc_add_param( 'vc_column_inner', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Reduce spacing (Padding) from left/right area in responsive mode", "fixtech"),
		"description" => esc_attr__("This is useful if you set extra padding via 'Design Options' tab. This will reset spacing (padding) from left/right area for the column.", "fixtech"),
		"param_name"  => "reduce_extra_padding",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("None (default)", "fixtech")                       		   => "",
			esc_attr__('Reset in small desktop (under 1200 pixel size)', "fixtech") => '1200',
			esc_attr__('Reset in tablet (under 992 pixel size)', "fixtech")         => '991',
		),
	));
	
	// VC COLUMN INNER : Add Shadow
	vc_add_param( 'vc_column_inner', array(
		"type"        => "dropdown",
		"heading"     => esc_attr__("Add shadow?", "fixtech"),
		"description" => esc_attr__("Select YES to set shadow for the column.", "fixtech"),
		"param_name"  => "tm_shadow",
		"weight"      => 1,
		"value"       => array(
			esc_attr__("No", "fixtech")  => "",
			esc_attr__('Yes', 'fixtech') => 'yes',
		),
	));
	
	// VC COLUMN INNER : Z-index
	vc_add_param( 'vc_column_inner', array(
		'type'			=> 'themetechmount_style_selector',
		'heading'		=> esc_attr__( 'Section position of this COLUMN (z-index of the COLUMN)', 'fixtech' ),
		'description'	=> esc_attr__( 'Select position of this COLUMN. This will add z-index css property to column. So you can overlap COLUMN on each over by setting z-index css property.', 'fixtech' ),
		'param_name'	=> 'tm_zindex',
		'std'			=> 'zero',
		"weight"      	=> 1,
		'value'			=> array(
			array(
				'label'	=> esc_attr('Z-Index- Style 0','fixtech'),
				'value'	=> 'zero',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-0.jpg',
				'width'	=> '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 1','fixtech'),
				'value'	=> '1',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-1.jpg',
				'width' => '120px',
			),
			array(
				'label'	=> esc_attr('Z-Index- Style 2','fixtech'),
				'value'	=> '2',
				'thumb'	=> get_template_directory_uri() . '/inc/images/zindex-2.jpg',
				'width' => '120px',
			),
		),
	));
	
	// VC COLUMN INNER : Responsive css settings
	vc_add_param( 'vc_column_inner', themetechmount_responsive_padding_margin_option('column') );	
	
}
}
add_action( 'vc_after_init', 'themetechmount_vc_add_extra_param' );

/**
 *  Adding skincolor in some elements
 */
if( !function_exists('themetechmount_vc_add_skin_color') ){
function themetechmount_vc_add_skin_color() {
	
	// Add vc element in which you like to add skincolor
	$vc_element_array = array(
		array( 'vc_tta_accordion', 'color' ),
		array( 'vc_tta_tour', 'color' ),
		array( 'vc_tta_tabs', 'color' ),
		array( 'vc_toggle', 'color' ),
	);
	
	// looping vc elements and adding skincolor
	foreach( $vc_element_array as $vc_element ){
		$element = $vc_element[0];
		$option  = $vc_element[1];
		$param   = WPBMap::getParam( $element, $option );
		$colors  = $param['value'];
		if( is_array($colors) ){
			$colors = array_reverse($colors);
			$colors[__( '[Skin color]', 'fixtech' )] = 'skincolor';
			$param['value']      = array_reverse($colors);
		}
		vc_update_shortcode_param( $element, $param );
	}
	
}
}
add_action( 'vc_after_init', 'themetechmount_vc_add_skin_color', 2 ); /* Note: here we are using vc_after_init because WPBMap::GetParam and mutateParame are available only when default content elements are "mapped" into the system */

/**
 *  Modify default values for VC elements
 */
if( !function_exists('themetechmount_vc_change_default_values') ){
function themetechmount_vc_change_default_values() {
	
	$vc_element_array = array(
		array( 'vc_tta_accordion',	'shape',	'square' ),
		array( 'vc_tta_accordion',	'no_fill',	'true' ),
		array( 'vc_tta_accordion',	'color',	'white' ),
		array( 'vc_tta_accordion',	'gap',		'10' ),
		array( 'vc_tta_tabs',		'shape',	'square' ),
		array( 'vc_tta_tabs',		'no_fill_content_area',	'true' ),
		array( 'vc_tta_tabs',		'color',	'skincolor' ),
		
		// style="outline" shape="square" controls_size="lg" active_section="1" no_fill_content_area="true" el_class="tm-tourtab-style1"
		array( 'vc_tta_tour',		'style',	'outline' ),
		array( 'vc_tta_tour',		'shape',	'square' ),
		array( 'vc_tta_tour',		'controls_size',	'lg' ),
		array( 'vc_tta_tour',		'active_section',	'1' ),
		array( 'vc_tta_tour',		'no_fill_content_area',	'true' ),
		array( 'vc_tta_tour',		'el_class',	'tm-tourtab-style1' ),	
	);
		
	// looping vc elements and adding skincolor
	foreach( $vc_element_array as $vc_element ){
		$element = $vc_element[0];
		$option  = $vc_element[1];
		$new_std = $vc_element[2];
	
		$param			= WPBMap::getParam( $element, $option );
		$param['std']	= $new_std;
		vc_update_shortcode_param( $element, $param );	
	}
}
}
add_action( 'vc_after_init', 'themetechmount_vc_change_default_values' );


/********************* Modifying TAB SECTION adding our own icon picker ***********************/

if( function_exists('vc_map_update') ){
	
	function themetechmount_vc_edit_tab_element(){
		
		$params = vc_map_integrate_shortcode( 'vc_tta_section');
		$new_params = array();
		
		// adding new icon library
		foreach( $params as $key=>$param ){
			
			if( isset($param['param_name']) && $param['param_name']=='i_type' ){
				
				// adding new icon library
				$libraries = array_merge(
					array( esc_attr__('Fixtech Special Icons','fixtech') => 'tm_fixtech' ),
					$param['value']
				);
				
				$param['value'] = $libraries;
				
				// adding new option
				$new_params[] = $param;
				
				// adding icon picker : tm_fixtech
				
				$new_params[] = array(
					'type'        => 'themetechmount_iconpicker',
					'heading'     => esc_attr__( 'Icon', 'fixtech' ),
					'param_name'  => 'i_icon_tm_fixtech',
					'value'       => 'flaticon-healthy-breakfast', // default value to backend editor admin_label
					'settings'    => array(
						'emptyIcon'    => false, // default true, display an "EMPTY" icon?
						'type'         => 'kw_fixtech',
					),
					'dependency'  => array(
						'element'  => 'i_type',
						'value'    => 'tm_fixtech',
					),
					'description'      => esc_attr__( 'Select icon from library.', 'fixtech' ),
					'edit_field_class' => 'vc_col-sm-9 vc_column',
				);
			} else {
				
				$new_params[] = $param;
				
			}

		}
				
		vc_map_update( 'vc_tta_section', array( 'params'=>$new_params ) );
	}
	
	add_action( 'vc_after_init', 'themetechmount_vc_edit_tab_element' );
	
}