<?php

/* Options */

$clientsGroupList = array();
if( taxonomy_exists('tm_client_group') ){
	$clientsGroupList_data = get_terms( 'tm_client_group', array( 'hide_empty' => false ) );
	$clientsGroupList      = array();
	foreach($clientsGroupList_data as $cat){
		$clientsGroupList[ esc_attr($cat->name) . ' (' . esc_attr($cat->count) . ')' ] = esc_attr($cat->slug);
	}
}

/**
 * Heading Element
 */
$heading_element = vc_map_integrate_shortcode( 'tm-heading', '', '',
	array(
		'exclude' => array(
			'el_class',
			'css',
			'css_animation'
		),
	)
);

/**
 * Box Design options
 */
$boxParams = themetechmount_box_params();

$allParams = array_merge(
	$heading_element,
	array(
		array(
			"type"        => "dropdown",
			"holder"      => "div",
			"class"       => "",
			"heading"     => esc_attr__("Client Logo Design",'fixtech'),
			"description" => esc_attr__("Select Client logo design.",'fixtech'),
			"param_name"  => "view",
			"value"       => themetechmount_global_client_template_list( true ),
			"std"         => "logo-only",
			'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
		),
		array(
			"type"        => "dropdown",
			"heading"     => esc_attr__("Show", "fixtech"),
			"param_name"  => "show",
			"description" => esc_attr__("Total Clients Logos you want to show.", "fixtech"),
			"value"       => array(
				esc_attr__("All", "fixtech") => "-1",
				esc_attr__("1", "fixtech")  => "1",
				esc_attr__("2", "fixtech") => "2",
				esc_attr__("3", "fixtech") => "3",
				esc_attr__("4", "fixtech") => "4",
				esc_attr__("5", "fixtech") => "5",
				esc_attr__("6", "fixtech") => "6",
				esc_attr__("7", "fixtech") => "7",
				esc_attr__("8", "fixtech") => "8",
				esc_attr__("9", "fixtech") => "9",
				esc_attr__("10", "fixtech") => "10",
				esc_attr__("11", "fixtech") => "11",
				esc_attr__("12", "fixtech") => "12",
				esc_attr__("13", "fixtech") => "13",
				esc_attr__("14", "fixtech") => "14",
				esc_attr__("15", "fixtech") => "15",
				esc_attr__("16", "fixtech") => "16",
				esc_attr__("17", "fixtech") => "17",
				esc_attr__("18", "fixtech") => "18",
				esc_attr__("19", "fixtech") => "19",
				esc_attr__("20", "fixtech") => "20",
			),
			"std"  => "10",
			'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
		),
		array(
			"type"        => "checkbox",
			"heading"     => esc_attr__("From Group", "fixtech"),
			"param_name"  => "category",
			"description" => esc_attr__("Select group so it will show client logo from selected group only.", "fixtech"),
			"value"       => $clientsGroupList,
			"std"         => "",
			'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
		),
		array(
			"type"        => "dropdown",
			"holder"      => "div",
			"class"       => "",
			"heading"     => esc_attr__("Show Tooltip on Logo?",'fixtech'),
			"description" => esc_attr__("Select YES to show Tooltip on the logo.",'fixtech'),
			"param_name"  => "show_tooltip",
			"value"       => array(
				esc_attr__("Yes", "fixtech") => "yes",
				esc_attr__("No", "fixtech")  => "no",
			),
			"std"         => "yes",
			'edit_field_class' => 'vc_col-sm-6 vc_column',
			'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
		),
		array(
			"type"        => "dropdown",
			"holder"      => "div",
			"class"       => "",
			"heading"     => esc_attr__("Add link to all logos?",'fixtech'),
			"description" => esc_attr__("Select YES to add link to all logos. Please note that link should be added to each client logo. If no link found than the logo will appear without link.",'fixtech'),
			"param_name"  => "add_link",
			"value"       => array(
				esc_attr__("Yes", "fixtech") => "yes",
				esc_attr__("No", "fixtech")  => "no",
			),
			"std"         => "yes",
			'edit_field_class' => 'vc_col-sm-6 vc_column',
			'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
		),
			
	),
	$boxParams,
	array(
		themetechmount_vc_ele_css_editor_option(),
	)
);

$params = $allParams;

// Changing default values
$i = 0;
foreach( $params as $param ){
	$param_name = (isset($param['param_name'])) ? $param['param_name'] : '' ;
	if( $param_name == 'h2' ){
		$params[$i]['std'] = 'Our Clients';
	
	} else if( $param_name == 'column' ){
		$params[$i]['std'] = 'five';
		
	} else if( $param_name == 'boxview' ){
		$params[$i]['std'] = 'carousel';
		
	} else if( $param_name == 'content' ){
		$params[$i]['std'] = '';
		
	} else if( $param_name == 'carousel_loop' ){
		$params[$i]['std'] = '1';
		
	} else if( $param_name == 'carousel_dots' ){
		$params[$i]['std'] = 'true';
		
	} else if( $param_name == 'carousel_nav' ){
		$params[$i]['std'] = '0';
		
	} else if( $param_name == 'h2_use_theme_fonts' ){
		$params[$i]['std'] = 'yes';
		
	} else if( $param_name == 'h4_use_theme_fonts' ){
		$params[$i]['std'] = 'yes';
			
	} else if( $param_name == 'txt_align' ){
		$params[$i]['std'] = 'center';
		
	}
	
	$i++;
}

global $tm_sc_params_clients;
$tm_sc_params_clients = $params;


vc_map( array(
	"name"     => esc_attr__("ThemetechMount Client Logo Box", "fixtech"),
	"base"     => "tm-clientsbox",
	"icon"     => "icon-themetechmount-vc",
	'category' => esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	"params"   => $params,
) );