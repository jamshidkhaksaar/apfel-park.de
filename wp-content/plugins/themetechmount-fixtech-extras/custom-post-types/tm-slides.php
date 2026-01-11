<?php 

function themetechmount_fixtech_cpt_tm_slides(){


	// Register Post Type
	$labels = array(
		'name'               => esc_attr_x( 'Slides', 'post type general name', 'tmte' ),
		'singular_name'      => esc_attr_x( 'Slide', 'post type singular name', 'tmte' ),
		'menu_name'          => esc_attr_x( 'Slides', 'admin menu', 'tmte' ),
		'name_admin_bar'     => esc_attr_x( 'Slide', 'add new on admin bar', 'tmte' ),
		'add_new'            => esc_attr_x( 'Add New', 'slide', 'tmte' ),
		'add_new_item'       => esc_attr__( 'Add New Slide', 'tmte' ),
		'new_item'           => esc_attr__( 'New Slide', 'tmte' ),
		'edit_item'          => esc_attr__( 'Edit Slide', 'tmte' ),
		'view_item'          => esc_attr__( 'View Slide', 'tmte' ),
		'all_items'          => esc_attr__( 'All Slides', 'tmte' ),
		'search_items'       => esc_attr__( 'Search Slide', 'tmte' ),
		'parent_item_colon'  => esc_attr__( 'Parent Slide:', 'tmte' ),
		'not_found'          => esc_attr__( 'No slide found.', 'tmte' ),
		'not_found_in_trash' => esc_attr__( 'No slide found in Trash.', 'tmte' )
	);
	$args = array(
		'labels'              => $labels,
		'menu_icon'           => 'dashicons-images-alt2',
		'public'              => true,
		'publicly_queryable'  => false,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'query_var'           => true,
		'rewrite'             => array( 'with_front' => false, 'slug' => 'slide' ),
		'capability_type'     => 'post',
		'has_archive'         => false,
		'hierarchical'        => false,
		'menu_position'       => null,
		'supports'            => array( 'title', 'thumbnail' ),
		'exclude_from_search' => true,
	);

	register_post_type( 'tm_slide', $args );
	
	

	/* Category */

	$labels = array(
		'name'              => _x( 'Slide Group', 'taxonomy general name', 'tmte' ),
		'singular_name'     => _x( 'Slide Group', 'taxonomy singular name', 'tmte' ),
		'search_items'      => esc_attr__( 'Search Group', 'tmte' ),
		'all_items'         => esc_attr__( 'All Groups', 'tmte' ),
		'parent_item'       => esc_attr__( 'Parent Group', 'tmte' ),
		'parent_item_colon' => esc_attr__( 'Parent Group:', 'tmte' ),
		'edit_item'         => esc_attr__( 'Edit Group', 'tmte' ),
		'update_item'       => esc_attr__( 'Update Group', 'tmte' ),
		'add_new_item'      => esc_attr__( 'Add New Group', 'tmte' ),
		'new_item_name'     => esc_attr__( 'New Group Name', 'tmte' ),
		'menu_name'         => esc_attr__( 'Slide Group', 'tmte' ),
	);
	
	
	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		//'rewrite'           => array( 'slug' => $tm_pf_category_slug ),
	);
	
	register_taxonomy( 'tm_slide_group', 'tm_slide', $args  );
	
	
	// Move Featured Image box from left to center only on CLIENTS custom_post_type
	add_action('do_meta_boxes', 'themetechmount_fixtech_tm_slides_featured_image_box');
	function themetechmount_fixtech_tm_slides_featured_image_box() {
		remove_meta_box( 'postimagediv', 'tm_slide', 'normal' );
		add_meta_box('postimagediv', esc_attr__('Slide Image','tmte'), 'post_thumbnail_meta_box', 'tm_slide', 'normal', 'high');
	}


}
add_action( 'init', 'themetechmount_fixtech_cpt_tm_slides', 8 );


/**
 *  Meta Box: Clients
 */
if ( ! function_exists( 'themetechmount_fixtech_tm_slides_metabox_options' ) ) {
function themetechmount_fixtech_tm_slides_metabox_options( $options ) {
	

	
	// Client Details Meta Box
	$options[]    = array(
		'id'        => 'themetechmount_slides_options',
		'title'     => esc_attr__('Fixtech: Slide Options','tmte'),
		'post_type' => 'tm_slide', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_sld_options',
				'title'  => esc_attr__('Slide Options', 'fixtech').'<small>'.__('Options for Slides', 'fixtech').'</small>',
				'fields' => array(
		
					array(
						'id'     		=> 'desc',
						'type'    		=> 'text',
						'title'   		=> esc_attr__('Description', 'tmte'),
						'after'  		=> '<div class="cs-text-muted"><br>'.__("Add description text for this slide", 'tmte').'</div>',
					),
					array(
						'id'     		=> 'btntext',
						'type'    		=> 'text',
						'title'   		=> esc_attr__('Button Text', 'tmte'),
						'after'  		=> '<div class="cs-text-muted"><br>'.__("Add text for button", 'tmte').'</div>',
					),
					array(
						'id'     		=> 'btnlink',
						'type'    		=> 'text',
						'title'   		=> esc_attr__('Button Link', 'tmte'),
						'after'  		=> '<div class="cs-text-muted"><br>'.__("Add URL for button", 'tmte').'</div>',
					),
				),
			),
		),
	);
	return $options;
}
}
add_filter( 'cs_metabox_options', 'themetechmount_fixtech_tm_slides_metabox_options' );