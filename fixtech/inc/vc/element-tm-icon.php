<?php

/* Options for ThemetechMount Icon */


/*
 * Icon Element
 * @since 4.4
 */


/**
 *  Show selected icon library only
 */
global $fixtech_theme_options;

// Temporary new list of icon libraries
$icon_library_array = array( // all icon library list array
	'themify'        => array( esc_attr__( 'Themify icons', 'fixtech' ),   'themifyicon ti-thumb-up'),
	'linecons'       => array( esc_attr__( 'Linecons', 'fixtech' ), 'vc_li vc_li-star'),
	'kw_fixtech'   => array( esc_attr__( 'Special Icons', 'fixtech' ), 'flaticon-honey'),
);


$icon_library = array();
if( isset($fixtech_theme_options['icon_library']) && is_array($fixtech_theme_options['icon_library']) && count($fixtech_theme_options['icon_library'])>0 ){
	// if selected icon library
	foreach( $fixtech_theme_options['icon_library'] as $i_library ){
		$icon_library[$i_library] = $icon_library_array[$i_library];
	}
}

$icon_element_array  = array();
$icon_dropdown_array = array( esc_attr__( 'Font Awesome', 'fixtech' )    => 'fontawesome' );   // Font Awesome icons
$icon_dropdown_array[ esc_attr__( 'Special Icons', 'fixtech' ) ] = 'kw_fixtech'; // Special icons

if( is_array($icon_library) && count($icon_library)>0 ){
foreach( $icon_library as $library_id=>$library ){
	
	$icon_dropdown_array[$library[0]] = $library_id;
	
	$icon_element_array[]  = array(
		'type'        => 'themetechmount_iconpicker',
		'heading'     => esc_attr__( 'Icon', 'fixtech' ),
		'param_name'  => 'icon_'.$library_id,
		'value'       => $library[1], // default value to backend editor admin_label
		'settings'    => array(
			'emptyIcon'    => false, // default true, display an "EMPTY" icon?
			'type'         => $library_id,
		),
		'dependency'  => array(
			'element'   => 'type',
			'value'     => $library_id,
		),
		'description' => esc_attr__( 'Select icon from library.', 'fixtech' ),
		'edit_field_class' => 'vc_col-sm-9 vc_column',
	);		
}
}
/* Select icon library code end here */

// All icon related elements
$icon_elements = array_merge(
	array(
		array(
			'type'        => 'dropdown',
			'heading'     => esc_attr__( 'Icon library', 'fixtech' ),
			'value'       => $icon_dropdown_array,
			'std'         => '',
			'admin_label' => true,
			'param_name'  => 'type',
			'description' => esc_attr__( 'Select icon library.', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-3 vc_column',
		)
	),
	array(
		array(  // Font Awesome icons
			'type'       => 'themetechmount_iconpicker',
			'heading'    => esc_attr__( 'Icon', 'fixtech' ),
			'param_name' => 'icon_fontawesome',
			'value'      => 'fa fa-thumbs-o-up', // default value to backend editor admin_label
			'settings'   => array(
				'emptyIcon'    => false, // default true, display an "EMPTY" icon?
				'type'         => 'fontawesome',
			),
			'dependency' => array(
				'element'  => 'type',
				'value'    => 'fontawesome',
			),
			'description' => esc_attr__( 'Select icon from library.', 'fixtech' ),
			'edit_field_class' => 'vc_col-sm-9 vc_column',
		),
	),

	$icon_element_array
		
);

$allparams = array(
	array(
		'type'        => 'dropdown',
		'heading'     => esc_attr__( 'Icon color', 'fixtech' ),
		'param_name'  => 'color',
		'value'       => array_merge( 
			themetechmount_getVcShared( 'colors' ),
			array(
				esc_attr__( 'Classic Grey', 'fixtech' )      => 'bar_grey',
				esc_attr__( 'Classic Blue', 'fixtech' )      => 'bar_blue',
				esc_attr__( 'Classic Turquoise', 'fixtech' ) => 'bar_turquoise',
				esc_attr__( 'Classic Green', 'fixtech' )     => 'bar_green',
				esc_attr__( 'Classic Orange', 'fixtech' )    => 'bar_orange',
				esc_attr__( 'Classic Red', 'fixtech' )       => 'bar_red',
				esc_attr__( 'Classic Black', 'fixtech' )     => 'bar_black',
			),
			array( esc_attr__( 'Custom color', 'fixtech' ) => 'custom' )
		),
		'std'         => 'skincolor',
		'description' => esc_attr__( 'Select icon color.', 'fixtech' ),
		'param_holder_class' => 'tm_vc_colored-dropdown',
	),
	array(
		'type'        => 'colorpicker',
		'heading'     => esc_attr__( 'Custom color', 'fixtech' ),
		'param_name'  => 'custom_color',
		'description' => esc_attr__( 'Select custom icon color.', 'fixtech' ),
		'dependency'  => array(
			'element'   => 'color',
			'value'     => 'custom',
		),
	),
	array(
		'type'        => 'dropdown',
		'heading'     => esc_attr__( 'Background shape', 'fixtech' ),
		'param_name'  => 'background_style',
		'value'       => array(
			esc_attr__( 'None', 'fixtech' ) => '',
			esc_attr__( 'Circle', 'fixtech' ) => 'rounded',
			esc_attr__( 'Square', 'fixtech' ) => 'boxed',
			esc_attr__( 'Rounded', 'fixtech' ) => 'rounded-less',
			esc_attr__( 'Outline Circle', 'fixtech' ) => 'rounded-outline',
			esc_attr__( 'Outline Square', 'fixtech' ) => 'boxed-outline',
			esc_attr__( 'Outline Rounded', 'fixtech' ) => 'rounded-less-outline',
		),
		'std'         => '',
		'description' => esc_attr__( 'Select background shape and style for icon.', 'fixtech' ),
		'param_holder_class' => 'tm-simplify-textarea',
	),
	array(
		'type'        => 'dropdown',
		'heading'     => esc_attr__( 'Background color', 'fixtech' ),
		'param_name'  => 'background_color',
		'value'       => array_merge( array( esc_attr__( 'Transparent', 'fixtech' ) => 'transparent' ), themetechmount_getVcShared( 'colors' ), array( esc_attr__( 'Custom color', 'fixtech' ) => 'custom' ) ),
		'std'         => 'grey',
		'description' => esc_attr__( 'Select background color for icon.', 'fixtech' ),
		'param_holder_class' => 'tm_vc_colored-dropdown',
		'dependency'  => array(
			'element'   => 'background_style',
			'not_empty' => true,
		),
	),
	array(
		'type'        => 'colorpicker',
		'heading'     => esc_attr__( 'Custom background color', 'fixtech' ),
		'param_name'  => 'custom_background_color',
		'description' => esc_attr__( 'Select custom icon background color.', 'fixtech' ),
		'dependency'  => array(
			'element'   => 'background_color',
			'value'     => 'custom',
		),
	),
	array(
		'type'        => 'dropdown',
		'heading'     => esc_attr__( 'Size', 'fixtech' ),
		'param_name'  => 'size',
		'value'       => array_merge( themetechmount_getVcShared( 'sizes' ), array( 'Extra Large' => 'xl' ) ),
		'std'         => 'md',
		'description' => esc_attr__( 'Icon size.', 'fixtech' )
	),
	array(
		'type'       => 'dropdown',
		'heading'    => esc_attr__( 'Icon alignment', 'fixtech' ),
		'param_name' => 'align',
		'value'      => array(
			esc_attr__( 'Left', 'fixtech' )   => 'left',
			esc_attr__( 'Right', 'fixtech' )  => 'right',
			esc_attr__( 'Center', 'fixtech' ) => 'center',
		),
		'std'         => 'left',
		'description' => esc_attr__( 'Select icon alignment.', 'fixtech' ),
	),
	array(
		'type'        => 'vc_link',
		'heading'     => esc_attr__( 'URL (Link)', 'fixtech' ),
		'param_name'  => 'link',
		'description' => esc_attr__( 'Add link to icon.', 'fixtech' )
	),
	vc_map_add_css_animation(),
	themetechmount_vc_ele_extra_class_option(),
	themetechmount_vc_ele_css_editor_option(),
);

// All params
$params = array_merge( $icon_elements, $allparams );
	
global $tm_sc_params_icon;
$tm_sc_params_icon = $params;

vc_map( array(
	'name'     => esc_attr__( 'ThemetechMount Icon', 'fixtech' ),
	'base'     => 'tm-icon',
	'icon'     => 'icon-themetechmount-vc',
	'category' => array( esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ) ),
	'admin_enqueue_css' => array(get_template_directory_uri().'/assets/themify-icons/themify-icons.css', get_template_directory_uri().'/assets/twemoji-awesome/twemoji-awesome.css' ),
	'params'   => $params,
	'js_view'  => 'VcIconElementView_Backend',
) );
