<?php

/* Options for ThemetechMount Blogbox */

$portfolioCatList = array();
if( taxonomy_exists('tm_portfolio_category') ){
	$portfolioCatList_data = get_terms( 'tm_portfolio_category', array( 'hide_empty' => false ) );
	$portfolioCatList      = array();
	foreach($portfolioCatList_data as $cat){
		$portfolioCatList[ esc_attr($cat->name) . ' (' . esc_attr($cat->count) . ')' ] = esc_attr($cat->slug);
	}
}

// Getting Options
$fixtech_theme_options   = get_option('fixtech_theme_options');
$pf_type_title          = ( !empty($fixtech_theme_options['pf_type_title']) ) ? $fixtech_theme_options['pf_type_title'] : 'Portfolio' ;
$pf_type_title_singular = ( !empty($fixtech_theme_options['pf_type_title_singular']) ) ? $fixtech_theme_options['pf_type_title_singular'] : 'Portfolio' ;
$pf_cat_title           = ( !empty($fixtech_theme_options['pf_cat_title']) ) ? $fixtech_theme_options['pf_cat_title'] : 'Portfolio Categories' ;
$pf_cat_title_singular  = ( !empty($fixtech_theme_options['pf_cat_title_singular']) ) ? $fixtech_theme_options['pf_cat_title_singular'] : 'Portfolio Category' ;

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
				"heading"     => esc_attr__("Box Design",'fixtech'),
				"description" => esc_attr__("Select box design.",'fixtech'),
				"param_name"  => "view",
				"value"       => themetechmount_global_portfolio_template_list( true ),
				"std"         => "overlay",
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				"type"        => "dropdown",
				"holder"      => "div",
				"class"       => "",
				"heading"     => esc_attr__("Show",'fixtech'),
				"description" => sprintf( esc_attr__("How many %s item you want to show.", "fixtech"), $pf_type_title ),
				"param_name"  => "show",
				"value"       => array(
					esc_attr__("All", "fixtech") => "-1",
					esc_attr__('1', "fixtech")   => "1",
					esc_attr__('2', "fixtech")   => "2",
					esc_attr__('3','fixtech')    =>'3',
					esc_attr__('4','fixtech')    =>'4',
					esc_attr__('5','fixtech')    =>'5',
					esc_attr__('6','fixtech')    =>'6',
					esc_attr__('7','fixtech')    =>'7',
					esc_attr__('8','fixtech')    =>'8',
					esc_attr__('9','fixtech')    =>'9',
					esc_attr__('10','fixtech')   =>'10',
					esc_attr__('11','fixtech')   =>'11',
					esc_attr__('12','fixtech')   =>'12',
					esc_attr__('13','fixtech')   =>'13',
					esc_attr__('14','fixtech')   =>'14',
					esc_attr__('15','fixtech')   =>'15',
					esc_attr__('16','fixtech')   =>'16',
					esc_attr__('17','fixtech')   =>'17',
					esc_attr__('18','fixtech')   =>'18',
					esc_attr__('19','fixtech')   =>'19',
					esc_attr__('20','fixtech')   =>'20',
					esc_attr__('21','fixtech')   =>'21',
					esc_attr__('22','fixtech')   =>'22',
					esc_attr__('23','fixtech')   =>'23',
					esc_attr__('24','fixtech')   =>'24',
				),
				"std"  => "3",
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				"type"        => "dropdown",
				"holder"      => "div",
				"class"       => "",
				"heading"     => esc_attr__("Show Sortable Category Links",'fixtech'),
				"description" => sprintf( esc_attr__("Show sortable category links above %s items so user can sort by just single click.",'fixtech'), $pf_type_title_singular ),
				"param_name"  => "sortable",
				"value"       => array(
					esc_attr__('No','fixtech')  => 'no',
					esc_attr__('Yes','fixtech') => 'yes',
				),
				"std"         => "no",
				'dependency'  => array(
					'element'            => 'boxview',
					'value_not_equal_to' => array( 'carousel' ),
				),
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				'type'        => 'textfield',
				'heading'     => esc_attr__( 'Replace ALL word', 'fixtech' ),
				'param_name'  => 'allword',
				'description' => esc_attr__( 'Replace ALL word in sortable category links. Default is ALL word.', 'fixtech' ),
				"std"         => "All",
				'dependency'  => array(
					'element'   => 'sortable',
					'value'     => array( 'yes' ),
				),
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				'type'        => 'dropdown',
				'heading'     => esc_attr__( 'Sortable Button Type', 'fixtech' ),
				'description' => esc_attr__( 'Sortable Button type square or round', 'fixtech' ),
				'param_name'  => 'sortable_buttontype',
				"value"       => array(
					esc_attr__('Square','fixtech')  => 'square',
					esc_attr__('Round','fixtech') => 'round',
				),
				"std"         => "square",
				'dependency'  => array(
					'element'   => 'sortable',
					'value'     => array( 'yes' ),
				),
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				"type"        => "dropdown",
				"holder"      => "div",
				"class"       => "",
				"heading"     => esc_attr__("Show Pagination",'fixtech'),
				"description" => sprintf( esc_attr__("Show pagination links below %s boxes.",'fixtech'), $pf_type_title ),
				"param_name"  => "pagination",
				"value"       => array(
					esc_attr__('No','fixtech')  => 'no',
					esc_attr__('Yes','fixtech') => 'yes',
				),
				"std"         => "no",
				'dependency'  => array(
					'element'    => 'sortable',
					'value_not_equal_to' => array( 'yes' ),
				),
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				"type"        => "checkbox",
				"heading"     => sprintf( esc_attr__("From %s", "fixtech"), $pf_cat_title_singular ),
				"description" => sprintf( esc_attr__('If you like to show %1$s from selected %2$s than select the category here.', "fixtech"), $pf_type_title, $pf_cat_title ),				
				"param_name"  => "category",
				"value"       => $portfolioCatList,
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			
			array(
				"type"        => "dropdown",
				"holder"      => "div",
				"class"       => "",
				"heading"     => esc_attr__("Order by",'fixtech'),
				"description" => esc_attr__("Sort retrieved portfolio by parameter.",'fixtech'),
				"param_name"  => "orderby",
				"value"       => array(
					esc_attr__('No order (none)','fixtech')           => 'none',
					esc_attr__('Order by post id (ID)','fixtech')     => 'ID',
					esc_attr__('Order by author (author)','fixtech')  => 'author',
					esc_attr__('Order by title (title)','fixtech')    => 'title',
					esc_attr__('Order by slug (name)','fixtech')      => 'name',
					esc_attr__('Order by date (date)','fixtech')      => 'date',
					esc_attr__('Order by last modified date (modified)','fixtech') => 'modified',
					esc_attr__('Random order (rand)','fixtech')       => 'rand',
					esc_attr__('Order by number of comments (comment_count)','fixtech') => 'comment_count',					
				),
				'edit_field_class' => 'vc_col-sm-6 vc_column',
				"std"              => "date",
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				"type"        => "dropdown",
				"holder"      => "div",
				"class"       => "",
				"heading"     => esc_attr__("Order",'fixtech'),
				"description" => esc_attr__("Designates the ascending or descending order of the 'orderby' parameter.",'fixtech'),
				"param_name"  => "order",
				"value"       => array(
					esc_attr__('Ascending (1, 2, 3; a, b, c)','fixtech')  => 'ASC',
					esc_attr__('Descending (3, 2, 1; c, b, a)','fixtech') => 'DESC',
				),
				'edit_field_class' => 'vc_col-sm-6 vc_column',
				"std"              => "DESC",
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			),
			array(
				"type"        => "dropdown",
				"heading"     => esc_attr__("Box Spacing", "fixtech"),
				"param_name"  => "box_spacing",
				"description" => esc_attr__("Spacing between each box.", "fixtech"),
				"value"       => array(
					esc_attr__("Default", "fixtech")                        => "",
					esc_attr__("0 pixel spacing (joint boxes)", "fixtech")  => "0px",
					esc_attr__("5 pixel spacing", "fixtech")                => "5px",
					esc_attr__("10 pixel spacing", "fixtech")               => "10px",
				),
				"std"  => "10px",
				'group'		  => esc_attr__( 'Box Style', 'fixtech' ),
			)
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
		$params[$i]['std'] = 'Our Work';
		
	} else if( $param_name == 'h2_use_theme_fonts' ){
		$params[$i]['std'] = 'yes';
		
	} else if( $param_name == 'h4_use_theme_fonts' ){
		$params[$i]['std'] = 'yes';
		
	} else if( $param_name == 'txt_align' ){
		$params[$i]['std'] = 'center';
	}
	$i++;
}

global $tm_sc_params_portfoliobox;
$tm_sc_params_portfoliobox = $params;

vc_map( array(
	"name"     => sprintf( esc_attr__("ThemetechMount %s Box",'fixtech'), $pf_type_title_singular ),
	"base"     => "tm-portfoliobox",
	"class"    => "",
	'category' => esc_attr__( 'ThemetechMount Special Elements', 'fixtech' ),
	"icon"     => "icon-themetechmount-vc",
	"params"   => $params,
) );