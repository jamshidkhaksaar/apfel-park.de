<?php 

function themetechmount_fixtech_cpt_tm_testimonial(){

	
	/*
	 *  Custom Post Type
	 */
	$labels = array(
		'name'               => esc_attr_x( 'Testimonials', 'Testimonials post type general name', 'tmte' ),
		'singular_name'      => esc_attr_x( 'Testimonial', 'Testimonials post type singular name', 'tmte' ),
		'menu_name'          => esc_attr_x( 'Testimonials', 'Testimonials post type admin menu', 'tmte' ),
		'name_admin_bar'     => esc_attr_x( 'Testimonial', 'Testimonials post type - add new on admin bar', 'tmte' ),
		'add_new'            => esc_attr_x( 'Add New', 'testimonial', 'tmte' ),
		'add_new_item'       => esc_attr__( 'Add New Testimonial', 'tmte' ),
		'new_item'           => esc_attr__( 'New Testimonial', 'tmte' ),
		'edit_item'          => esc_attr__( 'Edit Testimonial', 'tmte' ),
		'view_item'          => esc_attr__( 'View Testimonial', 'tmte' ),
		'all_items'          => esc_attr__( 'All Testimonials', 'tmte' ),
		'search_items'       => esc_attr__( 'Search Testimonial', 'tmte' ),
		'parent_item_colon'  => esc_attr__( 'Parent Testimonial:', 'tmte' ),
		'not_found'          => esc_attr__( 'No testimonial found.', 'tmte' ),
		'not_found_in_trash' => esc_attr__( 'No testimonial found in Trash.', 'tmte' )
	);
	
	$args = array(
		'labels'             => $labels,
		'menu_icon'          => 'dashicons-format-status',
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'with_front' => false, 'slug' => 'testimonial' ),
		'capability_type'    => 'post',
		'has_archive'        => false,
		'hierarchical'       => false,
		'menu_position'      => null,
		'supports'           => array( 'title', 'editor', 'thumbnail' ),
		'exclude_from_search' => true,
	);

	register_post_type( 'tm_testimonial', $args );
	
	
	
	// Testimonial Group

	$labels = array(
		'name'              => _x( 'Testimonial Group', 'taxonomy general name', 'tmte' ),
		'singular_name'     => _x( 'Testimonial Group', 'taxonomy singular name', 'tmte' ),
		'search_items'      => esc_attr__( 'Search Group', 'tmte' ),
		'all_items'         => esc_attr__( 'All Groups', 'tmte' ),
		'parent_item'       => esc_attr__( 'Parent Group', 'tmte' ),
		'parent_item_colon' => esc_attr__( 'Parent Group:', 'tmte' ),
		'edit_item'         => esc_attr__( 'Edit Group', 'tmte' ),
		'update_item'       => esc_attr__( 'Update Group', 'tmte' ),
		'add_new_item'      => esc_attr__( 'Add New Group', 'tmte' ),
		'new_item_name'     => esc_attr__( 'New Group Name', 'tmte' ),
		'menu_name'         => esc_attr__( 'Testimonial Group', 'tmte' ),
	);
	
	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		//'rewrite'           => array( 'slug' => $tm_pf_category_slug ),
	);
	
	register_taxonomy( 'tm_testimonial_group', 'tm_testimonial', $args  );
	
	
	
	/* Change "Enter Title Here" */
	function themetechmount_fixtech_tm_testimonial_enter_title_here( $title ){
		$screen = get_current_screen();
		if ( 'tm_testimonial' == $screen->post_type ) {
			$title = esc_attr__('Person or Company Name', 'tmte');
		}
		return $title;
	}
	add_filter( 'enter_title_here', 'themetechmount_fixtech_tm_testimonial_enter_title_here' );


	// Move Featured Image box from left to center only on CLIENTS custom_post_type
	add_action('do_meta_boxes', 'themetechmount_fixtech_tm_testimonial_featured_image_box');
	function themetechmount_fixtech_tm_testimonial_featured_image_box() {
		remove_meta_box( 'postimagediv', 'tm_testimonial', 'normal' );
		add_meta_box('postimagediv', esc_attr__('Select/Upload Image of Person or Company','tmte'), 'post_thumbnail_meta_box', 'tm_testimonial', 'normal', 'high');
	}
		
}
add_action( 'init', 'themetechmount_fixtech_cpt_tm_testimonial', 8 );








// Show Featured image in the admin section
add_filter( 'manage_tm_testimonial_posts_columns', 'themetechmount_tm_testimonial_tm_testimonial_set_featured_image_column' );
add_action( 'manage_tm_testimonial_posts_custom_column' , 'themetechmount_tm_testimonial_set_featured_image_column_content', 10, 2 );
if ( ! function_exists( 'themetechmount_tm_testimonial_tm_testimonial_set_featured_image_column' ) ) {
function themetechmount_tm_testimonial_tm_testimonial_set_featured_image_column($columns) {
	$new_columns = array();
	foreach( $columns as $key=>$val ){
		$new_columns[$key] = $val;
		if( $key=='title' ){
			$new_columns['themetechmount_featured_image'] = esc_attr__( 'Featured Image', 'fixtech' );
		}
	}
	return $new_columns;
}
}
if ( ! function_exists( 'themetechmount_tm_testimonial_set_featured_image_column_content' ) ) {
function themetechmount_tm_testimonial_set_featured_image_column_content( $column, $post_id ) {
	if( $column == 'themetechmount_featured_image' ){
		echo '<a href="'. get_permalink($post_id) .'">';
		if ( has_post_thumbnail($post_id) ) {
			the_post_thumbnail('thumbnail');
		} else {
			echo '<img src="' . TMTE_URI . '/images/admin-no-image.png" />';
		}
		echo '</a>';
	}
}
}





/**
 *  Meta Box: Clients
 */
if ( ! function_exists( 'themetechmount_fixtech_tm_testimonials_metabox_options' ) ) {
function themetechmount_fixtech_tm_testimonials_metabox_options( $options ) {
	

	
	// Client Details Meta Box
	$options[]    = array(
		'id'        => 'themetechmount_testimonials_details',
		'title'     => esc_attr__('Fixtech: Testimonial Details', 'tmte'),
		'post_type' => 'tm_testimonial', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_testi_details',
				'fields' => array(
		
					array(
						'id'     		=> 'clienturl',
						'type'    		=> 'text',
						'title'   		=> esc_attr__('Website Link', 'tmte'),
						'after'  		=> '<div class="cs-text-muted"><br>'.__("(Optional) Please fill person or company's website link", 'tmte').'</div>',
					),
					array(
						'id'     		=> 'designation',
						'type'    		=> 'text',
						'title'   		=> esc_attr__('Person Designation or Company Name', 'tmte'),
						'after'  		=> '<div class="cs-text-muted"><br>'.__("(Optional) Please fill designation of the person. Fill Company name if it is a company", 'tmte').'</div>',
					),
					array(
						'id'           	=> 'star_ratings',
						'type'         	=> 'select',
						'title'        	=>  esc_attr__('Select Star Ratings', 'tmte'),
						'options'  		=> array(
							'1'				=> esc_attr__('One star', 'tmte'),
							'2'				=> esc_attr__('Two stars', 'tmte'),
							'3'				=> esc_attr__('Three stars', 'tmte'),
							'4'				=> esc_attr__('Four stars', 'tmte'),
							'5'				=> esc_attr__('Five stars', 'tmte'),
						),
						'default'      	=> '5',
						'after'  		=> '<div class="cs-text-muted"><br>'.__("Please select star ratings.", 'tmte').'</div>',
					),
				),
			),
		),
	);
	return $options;
}
}
add_filter( 'cs_metabox_options', 'themetechmount_fixtech_tm_testimonials_metabox_options' );

