<?php

// Icon picker
$icons_params = vc_map_integrate_shortcode( 'tm-icon', 'i_', '',
	array(
		'include_only_regex' => '/^(type|icon_\w*)/',
		// we need only type, icon_fontawesome, icon_blabla..., NOT color and etc
	), array(
		'element' => 'add_icon',
		'value' => 'true',
	)
);

// each progress bar options
$param_group = array(
	array(
		'type' => 'textfield',
		'heading' => esc_attr__( 'Label', 'fixtech' ),
		'param_name' => 'label',
		'description' => esc_attr__( 'Enter text used as title of bar.', 'fixtech' ),
		'admin_label' => true,
	),
	array(
		'type' => 'textfield',
		'heading' => esc_attr__( 'Value', 'fixtech' ),
		'param_name' => 'value',
		'description' => esc_attr__( 'Enter value of bar.', 'fixtech' ),
		'admin_label' => true,
	),
	array(
		'type' => 'dropdown',
		'heading' => esc_attr__( 'Color', 'fixtech' ),
		'param_name' => 'color',
		'value' => array(
				esc_attr__( 'Default', 'fixtech' ) => '',
			) + array(
				esc_attr__( 'Classic Grey', 'fixtech' ) => 'bar_grey',
				esc_attr__( 'Classic Blue', 'fixtech' ) => 'bar_blue',
				esc_attr__( 'Classic Turquoise', 'fixtech' ) => 'bar_turquoise',
				esc_attr__( 'Classic Green', 'fixtech' ) => 'bar_green',
				esc_attr__( 'Classic Orange', 'fixtech' ) => 'bar_orange',
				esc_attr__( 'Classic Red', 'fixtech' ) => 'bar_red',
				esc_attr__( 'Classic Black', 'fixtech' ) => 'bar_black',
			) + themetechmount_getVcShared( 'colors-dashed' ) /*+ array(
				esc_attr__( 'Custom Color', 'fixtech' ) => 'custom',
			)*/,
		'description' => esc_attr__( 'Select single bar background color.', 'fixtech' ),
		'admin_label' => true,
		'param_holder_class' => 'vc_colored-dropdown',
	),
	
	// Show / Hide icon
	array(
		'type'       => 'dropdown',
		'heading'    => esc_attr__( 'Show Icon?', 'fixtech' ),
		'param_name' => 'add_icon',
		'value'      => array(
			esc_attr__( 'Yes', 'fixtech' ) => 'true',
			esc_attr__( 'No', 'fixtech' )  => 'false',
		),
		'std'         => 'true',
		'description' => esc_attr__( 'Want to show icon with the progress bar.', 'fixtech' ),
	)
);

// Merging icon with other options
$param_group = array_merge( $param_group, $icons_params );

$params =  array(
	array(
		'type' => 'textfield',
		'heading' => esc_attr__( 'Widget title', 'fixtech' ),
		'param_name' => 'title',
		'description' => esc_attr__( 'Enter text used as widget title (Note: located above content element).', 'fixtech' ),
	),
	array(
		'type' => 'param_group',
		'heading' => esc_attr__( 'Values', 'fixtech' ),
		'param_name' => 'values',
		'description' => esc_attr__( 'Enter values for graph - value, title and color.', 'fixtech' ),
		'value' => urlencode( json_encode( array(
			array(
				'label' => esc_attr__( 'Development', 'fixtech' ),
				'value' => '90',
			),
			array(
				'label' => esc_attr__( 'Design', 'fixtech' ),
				'value' => '80',
			),
			array(
				'label' => esc_attr__( 'Marketing', 'fixtech' ),
				'value' => '70',
			),
		) ) ),
		'params' => $param_group,
	),
	array(
		'type' => 'textfield',
		'heading' => esc_attr__( 'Units', 'fixtech' ),
		'param_name' => 'units',
		'description' => esc_attr__( 'Enter measurement units (Example: %, px, points, etc. Note: graph value and units will be appended to graph title).', 'fixtech' ),
	),
	array(
		'type' => 'dropdown',
		'heading' => esc_attr__( 'Color', 'fixtech' ),
		'param_name' => 'bgcolor',
		'std' => 'skincolor',
		'value' => array(
				esc_attr__( 'Classic Grey', 'fixtech' ) => 'bar_grey',
				esc_attr__( 'Classic Blue', 'fixtech' ) => 'bar_blue',
				esc_attr__( 'Classic Turquoise', 'fixtech' ) => 'bar_turquoise',
				esc_attr__( 'Classic Green', 'fixtech' ) => 'bar_green',
				esc_attr__( 'Classic Orange', 'fixtech' ) => 'bar_orange',
				esc_attr__( 'Classic Red', 'fixtech' ) => 'bar_red',
				esc_attr__( 'Classic Black', 'fixtech' ) => 'bar_black',
			) + themetechmount_getVcShared( 'colors-dashed' ) /* + array(
				esc_attr__( 'Custom Color', 'fixtech' ) => 'custom',
			)*/ ,
		'description' => esc_attr__( 'Select bar background color.', 'fixtech' ),
		'admin_label' => true,
		'param_holder_class' => 'vc_colored-dropdown',
	),
	array(
		'type' => 'checkbox',
		'heading' => esc_attr__( 'Options', 'fixtech' ),
		'param_name' => 'options',
		'value' => array(
			esc_attr__( 'Add stripes', 'fixtech' ) => 'striped',
			esc_attr__( 'Add animation (Note: visible only with striped bar).', 'fixtech' ) => 'animated',
		),
	),
);

$params = array_merge(
	$params,
	array( vc_map_add_css_animation() ),
	array( themetechmount_vc_ele_extra_class_option() ),
	array( themetechmount_vc_ele_css_editor_option() )
);
		
global $tm_sc_params_progressbar;
$tm_sc_params_progressbar = $params;


vc_map( array(
	'name'		=> esc_attr__( 'ThemetechMount Progress Bar', 'fixtech' ),
	'base'		=> 'tm-progress-bar',
	'class'		=> '',
	'icon'		=> 'icon-themetechmount-vc',
	'category'	=> esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	'params'	=> $params
) );