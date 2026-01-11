<?php

/* Options */

$allParams1 =  array(
	array(
		'type'			=> 'textfield',
		'holder'		=> 'div',
		'class'			=> '',
		'heading'		=> esc_attr__('Header (optional)', 'fixtech'),
		'param_name'	=> 'title',
		'std'			=> esc_attr__('Title Text', 'fixtech'),
		'description'	=> esc_attr__('Enter text for the title. Leave blank if no title is needed.', 'fixtech')
	),
	array(
		"type"			=> "dropdown",
		"holder"		=> "div",
		"class"			=> "",
		"heading"		=> esc_attr__("Design", 'fixtech'),
		"param_name"	=> "view",
		"description"	=> esc_attr__('Select box design.' , 'fixtech'),
		'value' => array(
			esc_attr__( 'Top Center icon', 'fixtech' )           => 'topicon',
			esc_attr__( 'Left icon', 'fixtech' )                 => 'lefticon',
			esc_attr__( 'Right icon', 'fixtech' )                => 'righticon',
			esc_attr__( 'Circle Progress Style', 'fixtech' ) 	 => 'circle-progress',
			esc_attr__( 'Style Five', 'fixtech' )                => 'style-five',
		),
		'std'           => 'topicon',
	),
	array(
		'type'       => 'checkbox',
		'heading'    => esc_attr__( 'Add icon?', 'fixtech' ),
		'param_name' => 'add_icon',
		'std'        => 'true',
		'edit_field_class'	=> 'vc_col-sm-6 vc_column',
		'dependency'  => array(
					'element'            => 'view',
					'value_not_equal_to' => array( 'circle-progress' ),
				),
	),
	array(
		'type'       => 'checkbox',
		'heading'    => esc_attr__( 'Add border?', 'fixtech' ),
		'param_name' => 'add_border',
		'std'        => 'false',
		'edit_field_class'	=> 'vc_col-sm-6 vc_column',
		'dependency'  => array(
					'element'            => 'view',
					'value_not_equal_to' => array( 'circle-progress' ),
				),
	),
	array(
		'type'       => 'dropdown',
		'heading'    => esc_attr__( 'Circle fill color', 'fixtech' ),
		'param_name' => 'circle_fill_color',
		'value'      => array(
				esc_attr__( 'Skincolor', 'fixtech' )      => 'skincolor',
				esc_attr__( 'Dark Grey', 'fixtech' )      => '20292f',
				esc_attr__( 'White', 'fixtech' ) 		   => '#fff',
			),
		'std'         => 'skincolor',
		'description' => esc_attr__( 'Select circle fill color.', 'fixtech' ),
		'param_holder_class' => 'tm_vc_colored-dropdown',
		'edit_field_class'   => 'vc_col-sm-6 vc_column',
		'dependency'  => array(
					'element'            => 'view',
					'value_not_equal_to' => array( 'topicon','lefticon','righticon','lefticon-border','righticon-border','style-five' ),
				),
	),
	array(
		'type'       => 'dropdown',
		'heading'    => esc_attr__( 'Circle empty color', 'fixtech' ),
		'param_name' => 'circle_empty_color',
		'value'      => array(
				esc_attr__( 'Skincolor', 'fixtech' )      => 'skincolor',
				esc_attr__( 'Dark Grey', 'fixtech' )      => '20292f',
				esc_attr__( 'White', 'fixtech' ) 		   => 'fff',
			),
		'std'         => '20292f',
		'description' => esc_attr__( 'Select circle empty color.', 'fixtech' ),
		'param_holder_class' => 'tm_vc_colored-dropdown',
		'edit_field_class'   => 'vc_col-sm-6 vc_column',
		'dependency'  => array(
					'element'            => 'view',
					'value_not_equal_to' => array( 'topicon','lefticon','righticon','lefticon-border','righticon-border','style-five'),
				),
	),
);

$icons_params = vc_map_integrate_shortcode( 'tm-icon', 'i_', '', array(
	'include_only_regex' => '/^(type|icon_\w*)/',
	// we need only type, icon_fontawesome, icon_blabla..., NOT color and etc
), array(
	'element' => 'add_icon',
	'value' => 'true',
) );

$icons_params_new = array();

/* Adding class for two column */
foreach( $icons_params as $param ){
	$param['edit_field_class'] = 'vc_col-sm-6 vc_column';
	$icons_params_new[] = $param;
}

$allParams2 = array(
			array(
				'type'				=> 'textfield',
				'holder'			=> 'div',
				'class'				=> '',
				'heading'			=> esc_attr__('Rotating Number', 'fixtech'),
				'param_name'		=> 'digit',
				'std'				=> '100',
				'description'		=> esc_attr__('Enter rotating number digit here.', 'fixtech'),
			),
			array(
				'type'				=> 'textfield',
				'holder'			=> 'div',
				'heading'			=> esc_attr__('Text Before Number', 'fixtech'),
				'param_name'		=> 'before',
				'description'		=> esc_attr__('Enter text which appear just before the rotating numbers.', 'fixtech'),
				'edit_field_class'	=> 'vc_col-sm-6 vc_column',
			),
			array(
				"type"			=> "dropdown",
				"holder"		=> "div",
				"heading"		=> esc_attr__("Text Style",'fixtech'),
				"param_name"	=> "beforetextstyle",
				"description"	=> esc_attr__('Select text style for the text.', 'fixtech') . '<br>' . esc_attr__('Superscript text appears half a character above the normal line, and is rendered in a smaller font.','fixtech') . '<br>' . esc_attr__('Subscript text appears half a character below the normal line, and is sometimes rendered in a smaller font.','fixtech'),
				'value' => array(
					esc_attr__( 'Superscript', 'fixtech' ) => 'sup',
					esc_attr__( 'Subscript', 'fixtech' )   => 'sub',
					esc_attr__( 'Normal', 'fixtech' )      => 'span',
				),
				'std' => 'sup',
				'edit_field_class'	=> 'vc_col-sm-6 vc_column',
			),
			array(
				'type'				=> 'textfield',
				'holder'			=> 'div',
				'class'				=> '',
				'heading'			=> esc_attr__('Text After Number', 'fixtech'),
				'param_name'		=> 'after',
				'description'		=> esc_attr__('Enter text which appear just after the rotating numbers.', 'fixtech'),
				'edit_field_class'	=> 'vc_col-sm-6 vc_column',
			),
			array(
				"type"			=> "dropdown",
				"holder"		=> "div",
				"class"			=> "",
				"heading"		=> esc_attr__("Text Style",'fixtech'),
				"param_name"	=> "aftertextstyle",
				"description"	=> esc_attr__('Select text style for the text.', 'fixtech') . '<br>' . esc_attr__('Superscript text appears half a character above the normal line, and is rendered in a smaller font.','fixtech') . '<br>' . esc_attr__('Subscript text appears half a character below the normal line, and is sometimes rendered in a smaller font.','fixtech'),
				'value' => array(
					esc_attr__( 'Superscript', 'fixtech' ) => 'sup',
					esc_attr__( 'Subscript', 'fixtech' )   => 'sub',
					esc_attr__( 'Normal', 'fixtech' )      => 'span',
				),
				'std' => 'sub',
				'edit_field_class'	=> 'vc_col-sm-6 vc_column',
			),
			array(
				'type'			=> 'textfield',
				'holder'		=> 'div',
				'class'			=> '',
				'heading'		=> esc_attr__('Rotating digit Interval', 'fixtech'),
				'param_name'	=> 'interval',
				'std'			=> '5',
				'description'	=> esc_attr__('Enter rotating interval number here.', 'fixtech')
			)
);

// merging all options
$params = array_merge( $allParams1, $icons_params_new, $allParams2 );

// merging extra options like css animation, css options etc
$params = array_merge(
	$params,
	array( vc_map_add_css_animation() ),
	array( themetechmount_vc_ele_extra_class_option() ),
	array( themetechmount_vc_ele_css_editor_option() )
);

global $tm_sc_params_facts_in_digits;
$tm_sc_params_facts_in_digits = $params;

vc_map( array(
	'name'		=> esc_attr__( 'ThemetechMount Facts in digits', 'fixtech' ),
	'base'		=> 'tm-facts-in-digits',
	'class'		=> '',
	'icon'		=> 'icon-themetechmount-vc',
	'category'	=> esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	'params'	=> $params
) );