<?php 

function themetechmount_fixtech_cpt_tm_client(){
	
	// Register Post Type
	$labels = array(
		'name'               => esc_attr_x( 'Clients', 'post type general name', 'tmte' ),
		'singular_name'      => esc_attr_x( 'Client', 'post type singular name', 'tmte' ),
		'menu_name'          => esc_attr_x( 'Client Logos', 'admin menu', 'tmte' ),
		'name_admin_bar'     => esc_attr_x( 'Client', 'add new on admin bar', 'tmte' ),
		'add_new'            => esc_attr_x( 'Add New', 'client', 'tmte' ),
		'add_new_item'       => esc_attr__( 'Add New Client', 'tmte' ),
		'new_item'           => esc_attr__( 'New Client', 'tmte' ),
		'edit_item'          => esc_attr__( 'Edit Client', 'tmte' ),
		'view_item'          => esc_attr__( 'View Client', 'tmte' ),
		'all_items'          => esc_attr__( 'All Clients', 'tmte' ),
		'search_items'       => esc_attr__( 'Search Client', 'tmte' ),
		'parent_item_colon'  => esc_attr__( 'Parent Client:', 'tmte' ),
		'not_found'          => esc_attr__( 'No client found.', 'tmte' ),
		'not_found_in_trash' => esc_attr__( 'No client found in Trash.', 'tmte' )
	);
	$args = array(
		'labels'             => $labels,
		'menu_icon'          => 'dashicons-businessman',
		'public'             => true,
		'publicly_queryable' => false,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'with_front' => false, 'slug' => 'client' ),
		'capability_type'    => 'post',
		'has_archive'        => false,
		'hierarchical'       => false,
		'menu_position'      => null,
		'supports'           => array( 'title', 'thumbnail' ),
		'exclude_from_search' => true,
	);

	register_post_type( 'tm_client', $args );
	




	/* Category */
	
	$labels = array(
		'name'              => _x( 'Client Group', 'taxonomy general name', 'tmte' ),
		'singular_name'     => _x( 'Client Group', 'taxonomy singular name', 'tmte' ),
		'search_items'      => esc_attr__( 'Search Client Group', 'tmte' ),
		'all_items'         => esc_attr__( 'All Client Groups', 'tmte' ),
		'parent_item'       => esc_attr__( 'Parent Group', 'tmte' ),
		'parent_item_colon' => esc_attr__( 'Parent Group:', 'tmte' ),
		'edit_item'         => esc_attr__( 'Edit Group', 'tmte' ),
		'update_item'       => esc_attr__( 'Update Group', 'tmte' ),
		'add_new_item'      => esc_attr__( 'Add New Client Group', 'tmte' ),
		'new_item_name'     => esc_attr__( 'New Client Group Name', 'tmte' ),
		'menu_name'         => esc_attr__( 'Client Group', 'tmte' ),
	);

	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		//'rewrite'           => array( 'slug' => $tm_pf_category_slug ),
	);
	
	register_taxonomy( 'tm_client_group', 'tm_client', $args  );


	/* Change "Enter Title Here" */
	function themetechmount_fixtech_tm_client_enter_title_here( $title ){
		$screen = get_current_screen();
		if ( 'tm_client' == $screen->post_type ) {
			$title = esc_attr__('Client Name', 'tmte');
		}
		return $title;
	}
	add_filter( 'enter_title_here', 'themetechmount_fixtech_tm_client_enter_title_here' );




	// Move Featured Image box from left to center only on CLIENTS custom_post_type
	add_action('do_meta_boxes', 'themetechmount_fixtech_tm_client_featured_image_box');
	function themetechmount_fixtech_tm_client_featured_image_box() {
		remove_meta_box( 'postimagediv', 'tm_client', 'normal' );
		add_meta_box('postimagediv', esc_attr__('Select/Upload Image of the Client','tmte'), 'post_thumbnail_meta_box', 'tm_client', 'normal', 'high');
	}



	
}
add_action( 'init', 'themetechmount_fixtech_cpt_tm_client', 8 );





// Show Featured image in the admin section
add_filter( 'manage_tm_client_posts_columns', 'themetechmount_tm_client_set_featured_image_column' );
add_action( 'manage_tm_client_posts_custom_column' , 'themetechmount_tm_client_set_featured_image_column_content', 10, 2 );
if ( ! function_exists( 'themetechmount_tm_client_set_featured_image_column' ) ) {
function themetechmount_tm_client_set_featured_image_column($columns) {
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
if ( ! function_exists( 'themetechmount_tm_client_set_featured_image_column_content' ) ) {
function themetechmount_tm_client_set_featured_image_column_content( $column, $post_id ) {
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
if ( ! function_exists( 'themetechmount_fixtech_tm_client_metabox_options' ) ) {
function themetechmount_fixtech_tm_client_metabox_options( $options ) {
	

	
	// Client Details Meta Box
	$options[]    = array(
		'id'        => 'themetechmount_clients_details',
		'title'     => esc_attr__('Fixtech: Client Details', 'tmte'),
		'post_type' => 'tm_client', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_clients',
				'fields' => array(
		
					array(
						'id'     		=> 'clienturl',
						'type'    		=> 'text',
						'title'   		=> esc_attr__('Website Link', 'tmte'),
						'after'  		=> '<div class="cs-text-muted"><br>'.__("(Optional) Please fill person or company's website link", 'tmte').'</div>',
					),
				),
			),
		),
	);
	return $options;
}
}

if( function_exists('cs_framework_init') ){
	add_filter( 'cs_metabox_options', 'themetechmount_fixtech_tm_client_metabox_options' );
}