<?php

function themetechmount_fixtech_cpt_tm_service(){

	$fixtech_theme_options = get_option('fixtech_theme_options');
	
	$service_type_title          = ( !empty($fixtech_theme_options['service_type_title']) ) ? $fixtech_theme_options['service_type_title'] : 'Service' ;
	$service_type_title_singular = ( !empty($fixtech_theme_options['service_type_title_singular']) ) ? $fixtech_theme_options['service_type_title_singular'] : 'Service' ;
	$service_type_slug           = ( !empty($fixtech_theme_options['service_type_slug']) ) ? $fixtech_theme_options['service_type_slug'] : 'service' ;
	
	$service_cat_title          = ( !empty($fixtech_theme_options['service_cat_title']) ) ? $fixtech_theme_options['service_cat_title'] : 'Service Categories' ;
	$service_cat_title_singular = ( !empty($fixtech_theme_options['service_cat_title_singular']) ) ? $fixtech_theme_options['service_cat_title_singular'] : 'Service Category' ;
	$service_cat_slug           = ( !empty($fixtech_theme_options['service_cat_slug']) ) ? $fixtech_theme_options['service_cat_slug'] : 'service-category' ;
	
	
	/*
	 *  Custom Post Type
	 */
	$labels = array(
		'name'               => esc_attr_x( 'Service', 'post type general name', 'tmte' ),
		'singular_name'      => esc_attr_x( 'Service', 'post type singular name', 'tmte' ),
		'menu_name'          => esc_attr_x( 'Service', 'admin menu', 'tmte' ),
		'name_admin_bar'     => esc_attr_x( 'Service', 'add new on admin bar', 'tmte' ),
		'add_new'            => esc_attr_x( 'Add New', 'service', 'tmte' ),
		'add_new_item'       => esc_attr__( 'Add New Service', 'tmte' ),
		'new_item'           => esc_attr__( 'New Service', 'tmte' ),
		'edit_item'          => esc_attr__( 'Edit Service', 'tmte' ),
		'view_item'          => esc_attr__( 'View Service', 'tmte' ),
		'all_items'          => esc_attr__( 'All Service', 'tmte' ),
		'search_items'       => esc_attr__( 'Search Service', 'tmte' ),
		'parent_item_colon'  => esc_attr__( 'Parent Service:', 'tmte' ),
		'not_found'          => esc_attr__( 'No Service found.', 'tmte' ),
		'not_found_in_trash' => esc_attr__( 'No Service found in Trash.', 'tmte' )
	);
	
	
	
	
	if( trim($service_type_title)!='Service' || trim($service_type_title_singular)!='Service' ){
		// Getting Team Member Title
		
		$labels = array(
			'name'               => esc_attr_x( $service_type_title, 'post type general name', 'tmte' ),
			'singular_name'      => esc_attr_x( $service_type_title_singular, 'post type singular name', 'tmte' ),
			'menu_name'          => esc_attr_x( $service_type_title_singular, 'admin menu', 'tmte' ),
			'name_admin_bar'     => esc_attr_x( $service_type_title_singular, 'add new on admin bar', 'tmte' ),
			'add_new'            => esc_attr_x( 'Add New', 'service', 'tmte' ),
			'add_new_item'       => esc_attr__( 'Add New '.$service_type_title_singular, 'tmte' ),
			'new_item'           => esc_attr__( 'New '.$service_type_title_singular, 'tmte' ),
			'edit_item'          => esc_attr__( 'Edit '.$service_type_title_singular, 'tmte' ),
			'view_item'          => esc_attr__( 'View '.$service_type_title_singular, 'tmte' ),
			'all_items'          => esc_attr__( 'All '.$service_type_title, 'tmte' ),
			'search_items'       => esc_attr__( 'Search '.$service_type_title_singular, 'tmte' ),
			'parent_item_colon'  => esc_attr__( 'Parent '.$service_type_title_singular.':', 'tmte' ),
			'not_found'          => esc_attr__( 'No '.strtolower($service_type_title_singular).' found.', 'tmte' ),
			'not_found_in_trash' => esc_attr__( 'No '.strtolower($service_type_title_singular).' found in Trash.', 'tmte' )
		);
	}
	
	
	
	$args = array(
		'labels'             => $labels,
		'menu_icon'          => 'dashicons-feedback',
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'with_front' => false, 'slug' => $service_type_slug ),
		'capability_type'    => 'post',
		'has_archive'        => false,
		'hierarchical'       => false,
		'menu_position'      => null,
		'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt'/*, 'custom-fields'*/ )
	);

	register_post_type( 'tm_service', $args );
	
	


	
	//Registaring Taxonomy for Post Type Service
	
	$labels = 	array(
		'name'              => esc_attr__('Service Category', 'tmte'),
		'singular_name'     => esc_attr__('Service Category', 'tmte'),
		'search_items'      => esc_attr__('Search Service Category', 'tmte'),
		'all_items'         => esc_attr__('All Service Category', 'tmte'), 
		'parent_item'       => esc_attr__('Parent Service Category', 'tmte'),
		'parent_item_colon' => esc_attr__('Parent Service Category:', 'tmte'), 
		'edit_item'         => esc_attr__('Edit Service Category', 'tmte'),
		'update_item'       => esc_attr__('Update Service Category', 'tmte'),
		'add_new_item'      => esc_attr__('Add New Service Category', 'tmte'),
		'new_item_name'     => esc_attr__('New Service Category Name', 'tmte'),
		'menu_name'         => esc_attr__('Service Category', 'tmte'),
	);
	
	

	if($service_cat_title != '' && $service_cat_title != esc_attr__('Service Category', 'tmte')){
		
		$labels = array(
			'name'              => sprintf( esc_attr__('%s', 'tmte'), $service_cat_title ),
			'singular_name'     => sprintf( esc_attr__('%s', 'tmte'), $service_cat_title_singular ),
			'search_items'      => sprintf( esc_attr__('Search %s', 'tmte'), $service_cat_title ),
			'all_items'         => sprintf( esc_attr__('All %s', 'tmte'), $service_cat_title ),
			'parent_item'       => sprintf( esc_attr__('Parent %s', 'tmte'), $service_cat_title_singular ),
			'parent_item_colon' => sprintf( esc_attr__('Parent %s:', 'tmte'), $service_cat_title_singular ),
			'edit_item'         => sprintf( esc_attr__('Edit %s', 'tmte'), $service_cat_title_singular ),
			'update_item'       => sprintf( esc_attr__('Update %s', 'tmte'), $service_cat_title_singular ),
			'add_new_item'      => sprintf( esc_attr__('Add New %s', 'tmte'), $service_cat_title_singular ),
			'new_item_name'     => sprintf( esc_attr__('New %s Name', 'tmte'), $service_cat_title_singular ),
			'menu_name'         => sprintf( esc_attr__('%s', 'tmte'), $service_cat_title_singular ),
		);
	}
	
	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => $service_cat_slug ),
	);
	
	register_taxonomy( 'tm_service_category', 'tm_service', $args  );
	
	
}

add_action( 'init', 'themetechmount_fixtech_cpt_tm_service', 8 );







// Show Featured image in the admin section
add_filter( 'manage_tm_service_posts_columns', 'themetechmount_tm_service_set_featured_image_column' );
add_action( 'manage_tm_service_posts_custom_column' , 'themetechmount_tm_service_set_featured_image_column_content', 10, 2 );
if ( ! function_exists( 'themetechmount_tm_service_set_featured_image_column' ) ) {
function themetechmount_tm_service_set_featured_image_column($columns) {
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
if ( ! function_exists( 'themetechmount_tm_service_set_featured_image_column_content' ) ) {
function themetechmount_tm_service_set_featured_image_column_content( $column, $post_id ) {
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
 *  Meta Boxes: Service
 */
if ( ! function_exists( 'themetechmount_fixtech_tm_service_metabox_options' ) ) {
function themetechmount_fixtech_tm_service_metabox_options( $options ) {
	
	// Praparing List options array
	$fixtech_theme_options = get_option('fixtech_theme_options');
	
	//
	//$service_type_title          = ( !empty($fixtech_theme_options['service_type_title']) ) ? $fixtech_theme_options['service_type_title'] : 'Service' ;
	$service_type_title_singular = ( !empty($fixtech_theme_options['service_type_title_singular']) ) ? $fixtech_theme_options['service_type_title_singular'] : 'Service' ;

	
	$post_id = !empty($_GET['post']) ? $_GET['post'] : get_the_ID() ;
	
	
	$list_array    = array();
	$options_array = array();
	if( isset($fixtech_theme_options['service_details_line']) && is_array($fixtech_theme_options['service_details_line']) && count( $fixtech_theme_options['service_details_line'] ) > 0 ){
		foreach( $fixtech_theme_options['service_details_line'] as $key=>$val ){
			
			// Icon classs
			$icon_class = $val['service_details_line_icon']['library_' . $val['service_details_line_icon']['library'] ];
			
			$option_array = array(
				'id'         => 'service_details_line_'.$key,
				'type'       => 'text',
				'title'      => '<span class="tm-admin-service-list-icon"> <i class="'. $icon_class .'"></i></span> &nbsp; '. esc_attr__($val['service_details_line_title'], 'fixtech'),
			);
			
			switch( $val['data'] ){
				
				case 'custom' :
				default :
					$option_array['type']         = 'text';
					break;
				
				case 'multiline' :
					$option_array['type']       = 'textarea';
					break;
				
				case 'date' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['value']      = get_the_date( '', $post_id );
					break;
				
				case 'category' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['wrap_class'] = 'tm-input-style-text';
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_service_category', '', ', ', '' ) );
					break;
				
				
				case 'category_link' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['wrap_class'] = 'tm-input-style-link';
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_service_category', '', ', ', '' ) );
					break;
					
				case 'tag' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['wrap_class'] = 'tm-input-style-text';
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_service_tags', '', ', ', '' ) );
					break;
					
				case 'tag_link' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['wrap_class'] = 'tm-input-style-link';
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_service_tags', '', ', ', '' ) );
					break;
					
			}
			
			// merging with main array
			$options_array[] = $option_array;
			
		}
	}
	
	
	
	if( count($options_array)==0 ){
		// No options created in Service Settings section.
		$list_array[] = array(
			'type'    => 'notice',
			'class'   => 'success',
			'content' => esc_attr__('There is no option to show. Please create some options from "Theme Options > Service Settings" section.', 'tmte'),
		);
	} else {
		
		// Options created in Service Settings section.
		$list_array = $options_array;
		
	}
	
	
	
	
	


	
	
	
	// Service Featured Image / Video / Slider Metabox
	$options[]    = array(
		'id'        => 'themetechmount_service_featured',
		'title'     => esc_attr__('Fixtech: Featured Image / Video / Slider', 'tmte'),
		'post_type' => 'tm_service', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_service_featured',
				'fields' => array(
		
					array(
						'id'       		=> 'featuredtype',
						'type'     		=> 'radio',
						'title'    		=>  esc_attr__('Featured Image / Video / Slider', 'tmte'),
						'options'       => array(
											'image'       => esc_attr__('Featured Image', 'tmte'),
											'video'       => esc_attr__('Video (YouTube or Vimeo)', 'tmte'),
											'audioembed'  => esc_attr__('Audio (SoundCloud embed code)', 'tmte'),
											'slider'	  => esc_attr__('Image Slider', 'tmte'),
										),
						'default'		=> 'image',
						'after'   		=> '<div class="cs-text-muted">'.__('Select what you want to show as featured. Image or Video', 'tmte').'</div>',
					),
					/* Video (YouTube or Vimeo) */
					array(
						'id'     		=> 'video_code',
						'type'    		=> 'textarea',
						'title'   		=> esc_attr__('', 'tmte'),
						'dependency' => array( 'featuredtype_video', '==', 'true' ),
						'after'  		=> '<div class="cs-text-muted"><br>'.__('Paste video url (oembed) or embed code.', 'tmte').'</div>',
					),
					/* Audio (SoundCloud embed code) */
					array(
						'id'     		=> 'audio_code',
						'type'    		=> 'wysiwyg',
						'title'   		=> esc_attr__('SoundCloud (or any other service) Embed Code or MP3 file path.', 'tmte'),
						'dependency' => array( 'featuredtype_audioembed', '==', 'true' ),
						'after'  		=> '<div class="cs-text-muted"><br>'.__('Paste SoundCloud or any other service embed code here', 'tmte').'</div>',
						'settings'      => array(
							'textarea_rows' => 5,
							'tinymce'       => false,
							'media_buttons' => false,
							'quicktags'     => false,
						)
					),
					/* Image Slider */
					array(
						'id'          => 'slide_images',
						//'debug'       => true,
						'type'        => 'gallery',
						'title'       => esc_attr__('Slider Images', 'tmte'),
						'add_title'   => 'Add Images',
						'edit_title'  => 'Edit Images',
						'clear_title' => 'Remove Images',
						'dependency'  => array( 'featuredtype_slider', '==', 'true' ),
						'after'       => '<br><div class="cs-text-muted">'.__('Select images for Slider gallery.', 'tmte').'</div>',
					),
					
					
				),
			),
			
		),
	);
	
	// Client Details Meta Box
	$options[]    = array(
		'id'        => 'themetechmount_tmservice_icon',
		'title'     => esc_attr__('Fixtech: Service icon', 'tmte'),
		'post_type' => 'tm_service', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_service_icon',
				'fields' => array(
		
					array(
						'id'     		=> 'tm_serviceicon',
						'type'    		=> 'themetechmount_iconpicker',
						'title'   		=> esc_attr__('Service Icon', 'tmte'),
						'after'  		=> '<div class="cs-text-muted"><br>'.__("(Optional) Please select icon for Servicebox element", 'tmte').'</div>',
					),
				),
			),
		),
	);
	
	return $options;
}
}
add_filter( 'cs_metabox_options', 'themetechmount_fixtech_tm_service_metabox_options' );