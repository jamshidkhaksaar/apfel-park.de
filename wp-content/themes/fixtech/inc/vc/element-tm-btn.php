<?php

/* Options for ThemetechMount Button */

global $tm_pixel_icons;
$icons_params = vc_map_integrate_shortcode( 'tm-icon', 'i_', '',
	array(
		'include_only_regex' => '/^(type|icon_\w*)/',
		// we need only type, icon_fontawesome, icon_blabla..., NOT color and etc
	), array(
		'element' => 'add_icon',
		'value' => 'true',
	)
);
// populate integrated tm-icons params.
if ( is_array( $icons_params ) && ! empty( $icons_params ) ) {
	foreach ( $icons_params as $key => $param ) {
		if ( is_array( $param ) && ! empty( $param ) ) {
			if ( 'i_type' === $param['param_name'] ) {
				// Do nothing
			}
			if ( isset( $param['admin_label'] ) ) {
				// remove admin label
				unset( $icons_params[ $key ]['admin_label'] );
			}

		}
	}
}
$params = array_merge(
	array(
		array(
			'type'       => 'textfield',
			'heading'    => esc_attr__( 'Text', 'fixtech' ),
			'param_name' => 'title',
			'value'      => esc_attr__( 'Text on the button', 'fixtech' ),
		),
		array(
			'type' => 'vc_link',
			'heading' => esc_attr__( 'URL (Link)', 'fixtech' ),
			'param_name' => 'link',
			'description' => esc_attr__( 'Add link to button.', 'fixtech' ),
		),
		array(
			'type' => 'dropdown',
			'heading' => esc_attr__( 'Style', 'fixtech' ),
			'description' => esc_attr__( 'Select button display style.', 'fixtech' ),
			'param_name' => 'style',
			'std'		 => 'flat',
			'value' => array(
				esc_attr__( 'Flat', 'fixtech' ) => 'flat',
				esc_attr__( 'Modern', 'fixtech' ) => 'modern',
				esc_attr__( 'Classic', 'fixtech' ) => 'classic',
				esc_attr__( 'Outline', 'fixtech' ) => 'outline',
				esc_attr__( '3d', 'fixtech' ) => '3d',
				esc_attr__( 'Simple Text', 'fixtech' ) => 'text',
				esc_attr__( 'Custom', 'fixtech' ) => 'custom',
				esc_attr__( 'Outline custom', 'fixtech' ) => 'outline-custom',
				esc_attr__( 'Gradient', 'fixtech' ) => 'gradient',
				esc_attr__( 'Gradient Custom', 'fixtech' ) => 'gradient-custom',
			),
		),
		
		array(
			'type' => 'dropdown',
			'heading' => esc_attr__( 'Gradient Color 1', 'fixtech' ),
			'param_name' => 'gradient_color_1',
			'description' => esc_attr__( 'Select first color for gradient.', 'fixtech' ),
			'param_holder_class' => 'tm_vc_colored-dropdown vc_btn3-colored-dropdown',
			'value' => themetechmount_getVcShared( 'colors-dashed' ),
			'std' => 'turquoise',
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'gradient' ),
			),
			'edit_field_class' => 'vc_col-sm-6 vc_column',
		),
		array(
			'type' => 'dropdown',
			'heading' => esc_attr__( 'Gradient Color 2', 'fixtech' ),
			'param_name' => 'gradient_color_2',
			'description' => esc_attr__( 'Select second color for gradient.', 'fixtech' ),
			'param_holder_class' => 'tm_vc_colored-dropdown vc_btn3-colored-dropdown',
			'value' => themetechmount_getVcShared( 'colors-dashed' ),
			'std' => 'blue',
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'gradient' ),
			),
			'edit_field_class' => 'vc_col-sm-6 vc_column',
		),
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Gradient Color 1', 'fixtech' ),
			'param_name' => 'gradient_custom_color_1',
			'description' => esc_attr__( 'Select first color for gradient.', 'fixtech' ),
			'param_holder_class' => 'tm_vc_colored-dropdown vc_btn3-colored-dropdown',
			'value' => '#dd3333',
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'gradient-custom' ),
			),
			'edit_field_class' => 'vc_col-sm-4 vc_column',
		),
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Gradient Color 2', 'fixtech' ),
			'param_name' => 'gradient_custom_color_2',
			'description' => esc_attr__( 'Select second color for gradient.', 'fixtech' ),
			'param_holder_class' => 'tm_vc_colored-dropdown vc_btn3-colored-dropdown',
			'value' => '#eeee22',
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'gradient-custom' ),
			),
			'edit_field_class' => 'vc_col-sm-4 vc_column',
		),
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Button Text Color', 'fixtech' ),
			'param_name' => 'gradient_text_color',
			'description' => esc_attr__( 'Select button text color.', 'fixtech' ),
			'param_holder_class' => 'tm_vc_colored-dropdown vc_btn3-colored-dropdown',
			'value' => '#ffffff',
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'gradient-custom' ),
			),
			'edit_field_class' => 'vc_col-sm-4 vc_column',
		),
		
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Background', 'fixtech' ),
			'param_name' => 'custom_background',
			'description' => esc_attr__( 'Select custom background color for your element.', 'fixtech' ),
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'custom' )
			),
			'edit_field_class' => 'vc_col-sm-6 vc_column',
			'std' => '#ededed',
		),
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Text', 'fixtech' ),
			'param_name' => 'custom_text',
			'description' => esc_attr__( 'Select custom text color for your element.', 'fixtech' ),
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'custom' )
			),
			'edit_field_class' => 'vc_col-sm-6 vc_column',
			'std' => '#666',
		),
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Outline and Text', 'fixtech' ),
			'param_name' => 'outline_custom_color',
			'description' => esc_attr__( 'Select outline and text color for your element.', 'fixtech' ),
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'outline-custom' )
			),
			'edit_field_class' => 'vc_col-sm-4 vc_column',
			'std' => '#666',
		),
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Hover background', 'fixtech' ),
			'param_name' => 'outline_custom_hover_background',
			'description' => esc_attr__( 'Select hover background color for your element.', 'fixtech' ),
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'outline-custom' )
			),
			'edit_field_class' => 'vc_col-sm-4 vc_column',
			'std' => '#666',
		),
		array(
			'type' => 'colorpicker',
			'heading' => esc_attr__( 'Hover text', 'fixtech' ),
			'param_name' => 'outline_custom_hover_text',
			'description' => esc_attr__( 'Select hover text color for your element.', 'fixtech' ),
			'dependency' => array(
				'element' => 'style',
				'value' => array( 'outline-custom' )
			),
			'edit_field_class' => 'vc_col-sm-4 vc_column',
			'std' => '#fff',
		),
		array(
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Shape', 'fixtech' ),
			'description' => esc_attr__( 'Select button shape.', 'fixtech' ),
			'param_name'  => 'shape',
			'std'		  => 'round',
			'value'       => array(
				esc_attr__( 'Square', 'fixtech' ) => 'square',
				esc_attr__( 'Rounded', 'fixtech' ) => 'rounded',
				esc_attr__( 'Round', 'fixtech' ) => 'round',
			),
		),
		array(
			'type' => 'dropdown',
			'heading' => esc_attr__( 'Color', 'fixtech' ),
			'param_name' => 'color',
			'description' => esc_attr__( 'Select button color.', 'fixtech' ),
			'param_holder_class' => 'tm_vc_colored-dropdown vc_btn3-colored-dropdown',
			'value' => array(
							esc_attr__( '[Skin Color]', 'fixtech' ) => 'skincolor',
							esc_attr__( 'Classic Grey', 'fixtech' ) => 'default',
							esc_attr__( 'Classic Blue', 'fixtech' ) => 'primary',
							esc_attr__( 'Classic Turquoise', 'fixtech' ) => 'info',
							esc_attr__( 'Classic Green', 'fixtech' ) => 'success',
							esc_attr__( 'Classic Orange', 'fixtech' ) => 'warning',
							esc_attr__( 'Classic Red', 'fixtech' ) => 'danger',
							esc_attr__( 'Classic Black', 'fixtech' ) => 'inverse'
					   ) + themetechmount_getVcShared( 'colors-dashed' ),
			'std' => 'skincolor',
			'dependency' => array(
				'element' => 'style',
				'value_not_equal_to' => array( 'custom', 'outline-custom' )
			),
		),
		array(
			'type' => 'dropdown',
			'heading' => esc_attr__( 'Button Size', 'fixtech' ),
			'param_name' => 'size',
			'description' => esc_attr__( 'Select button display size.', 'fixtech' ),
			'std' => 'md',
			'value' => themetechmount_getVcShared( 'sizes' ),
		),
		array(
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Button Text Bold?', 'fixtech' ),
			'param_name'  => 'font_weight',
			'description' => esc_attr__( 'Select YES if you like to bold the font text.', 'fixtech' ),
			'std'         => 'no',
			'value'       => array(
				esc_attr__( 'Yes', 'fixtech' ) => 'yes',
				esc_attr__( 'No', 'fixtech' )  => 'no',
			),
		),
		array(
			'type' => 'dropdown',
			'heading' => esc_attr__( 'Alignment', 'fixtech' ),
			'param_name' => 'align',
			'description' => esc_attr__( 'Select button alignment.', 'fixtech' ),
			'value' => array(
				esc_attr__( 'Inline', 'fixtech' ) => 'inline',
				esc_attr__( 'Left', 'fixtech' ) => 'left',
				esc_attr__( 'Right', 'fixtech' ) => 'right',
				esc_attr__( 'Center', 'fixtech' ) => 'center'
			),
		),
		array(
			'type'       => 'dropdown',
			'heading'    => esc_attr__( 'Set full width button?', 'fixtech' ),
			'param_name' => 'button_block',
			'dependency' => array(
				'element'            => 'align',
				'value_not_equal_to' => 'inline',
			),
			'value'      => array(
				esc_attr__( 'No', 'fixtech' )  => 'false',
				esc_attr__( 'Yes', 'fixtech' ) => 'true',
			),
		),
		array(
			'type'       => 'dropdown',
			'heading'    => esc_attr__( 'Add icon?', 'fixtech' ),
			'param_name' => 'add_icon',
			'value'      => array(
				esc_attr__( 'No',  'fixtech' ) => '',
				esc_attr__( 'Yes', 'fixtech' ) => 'true',
			),
		),
		
		array(
			'type' => 'dropdown',
			'heading' => esc_attr__( 'Icon Alignment', 'fixtech' ),
			'description' => esc_attr__( 'Select icon alignment.', 'fixtech' ),
			'param_name' => 'i_align',
			'value' => array(
				esc_attr__( 'Left', 'fixtech' ) => 'left',
				// default as well
				esc_attr__( 'Right', 'fixtech' ) => 'right',
			),
			'dependency' => array(
				'element' => 'add_icon',
				'value' => 'true',
			),
		),
	),
	
	$icons_params,
	
	array(
		vc_map_add_css_animation(),
		themetechmount_vc_ele_extra_class_option(),
		themetechmount_vc_ele_css_editor_option(),
	)
);

// Changing modifying, adding extra options
$i = 0;
foreach( $params as $param ){
	
	$param_name = (isset($param['param_name'])) ? $param['param_name'] : '' ;
	
	
	// Button Icon
	if( $param_name == 'i_align' ){
		$params[$i]['std'] = 'right';
	
	} else if( $param_name == 'i_type' ){
		$params[$i]['std'] = 'themify';
		
	} else if( $param_name == 'i_icon_themify' ){
		$params[$i]['std']   = 'themifyicon ti-arrow-right';
		$params[$i]['value'] = 'themifyicon ti-arrow-right';

	}
		
	$i++;
} // Foreach

global $tm_sc_params_btn;
$tm_sc_params_btn = $params;

vc_map( array(
	'name'     => esc_attr__( 'ThemetechMount Button', 'fixtech' ),
	'base'     => 'tm-btn',
	'icon'     => 'icon-themetechmount-vc',
	'category' => array( esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ) ),
	'params'   => $params,
	'js_view'  => 'VcButton3View',
	'custom_markup' => '{{title}}<div class="vc_btn3-container"><button class="vc_general vc_btn3 vc_btn3-size-sm vc_btn3-shape-{{ params.shape }} vc_btn3-style-{{ params.style }} vc_btn3-color-{{ params.color }}">{{{ params.title }}}</button></div>',
) );
