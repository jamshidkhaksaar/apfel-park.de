<?php

function themetechmount_fixtech_cpt_tm_portfolio(){

	$fixtech_theme_options = get_option('fixtech_theme_options');
	
	$pf_type_title          = ( !empty($fixtech_theme_options['pf_type_title']) ) ? $fixtech_theme_options['pf_type_title'] : 'Portfolio' ;
	$pf_type_title_singular = ( !empty($fixtech_theme_options['pf_type_title_singular']) ) ? $fixtech_theme_options['pf_type_title_singular'] : 'Portfolio' ;
	$pf_type_slug           = ( !empty($fixtech_theme_options['pf_type_slug']) ) ? $fixtech_theme_options['pf_type_slug'] : 'portfolio' ;
	
	$pf_cat_title          = ( !empty($fixtech_theme_options['pf_cat_title']) ) ? $fixtech_theme_options['pf_cat_title'] : 'Portfolio Categories' ;
	$pf_cat_title_singular = ( !empty($fixtech_theme_options['pf_cat_title_singular']) ) ? $fixtech_theme_options['pf_cat_title_singular'] : 'Portfolio Category' ;
	$pf_cat_slug           = ( !empty($fixtech_theme_options['pf_cat_slug']) ) ? $fixtech_theme_options['pf_cat_slug'] : 'portfolio-category' ;
	
	
	/*
	 *  Custom Post Type
	 */
	$labels = array(
		'name'               => esc_attr_x( 'Portfolio', 'post type general name', 'tmte' ),
		'singular_name'      => esc_attr_x( 'Portfolio', 'post type singular name', 'tmte' ),
		'menu_name'          => esc_attr_x( 'Portfolio', 'admin menu', 'tmte' ),
		'name_admin_bar'     => esc_attr_x( 'Portfolio', 'add new on admin bar', 'tmte' ),
		'add_new'            => esc_attr_x( 'Add New', 'portfolio', 'tmte' ),
		'add_new_item'       => esc_attr__( 'Add New Portfolio', 'tmte' ),
		'new_item'           => esc_attr__( 'New Portfolio', 'tmte' ),
		'edit_item'          => esc_attr__( 'Edit Portfolio', 'tmte' ),
		'view_item'          => esc_attr__( 'View Portfolio', 'tmte' ),
		'all_items'          => esc_attr__( 'All Portfolio', 'tmte' ),
		'search_items'       => esc_attr__( 'Search Portfolio', 'tmte' ),
		'parent_item_colon'  => esc_attr__( 'Parent Portfolio:', 'tmte' ),
		'not_found'          => esc_attr__( 'No portfolio found.', 'tmte' ),
		'not_found_in_trash' => esc_attr__( 'No portfolio found in Trash.', 'tmte' )
	);
	
	
	
	
	if( trim($pf_type_title)!='Portfolio' || trim($pf_type_title_singular)!='Portfolio' ){
		// Getting Team Member Title
		
		$labels = array(
			'name'               => esc_attr_x( $pf_type_title, 'post type general name', 'tmte' ),
			'singular_name'      => esc_attr_x( $pf_type_title_singular, 'post type singular name', 'tmte' ),
			'menu_name'          => esc_attr_x( $pf_type_title_singular, 'admin menu', 'tmte' ),
			'name_admin_bar'     => esc_attr_x( $pf_type_title_singular, 'add new on admin bar', 'tmte' ),
			'add_new'            => esc_attr_x( 'Add New', 'portfolio', 'tmte' ),
			'add_new_item'       => esc_attr__( 'Add New '.$pf_type_title_singular, 'tmte' ),
			'new_item'           => esc_attr__( 'New '.$pf_type_title_singular, 'tmte' ),
			'edit_item'          => esc_attr__( 'Edit '.$pf_type_title_singular, 'tmte' ),
			'view_item'          => esc_attr__( 'View '.$pf_type_title_singular, 'tmte' ),
			'all_items'          => esc_attr__( 'All '.$pf_type_title, 'tmte' ),
			'search_items'       => esc_attr__( 'Search '.$pf_type_title_singular, 'tmte' ),
			'parent_item_colon'  => esc_attr__( 'Parent '.$pf_type_title_singular.':', 'tmte' ),
			'not_found'          => esc_attr__( 'No '.strtolower($pf_type_title_singular).' found.', 'tmte' ),
			'not_found_in_trash' => esc_attr__( 'No '.strtolower($pf_type_title_singular).' found in Trash.', 'tmte' )
		);
	}
	
	
	
	$args = array(
		'labels'             => $labels,
		'menu_icon'          => 'dashicons-screenoptions',
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'with_front' => false, 'slug' => $pf_type_slug ),
		'capability_type'    => 'post',
		'has_archive'        => false,
		'hierarchical'       => false,
		'menu_position'      => null,
		'supports'           => array( 'title', 'editor', 'thumbnail'/*, 'custom-fields'*/ )
	);

	register_post_type( 'tm_portfolio', $args );
	
	


	
	//Registaring Taxonomy for Post Type Portfolio
	
	$labels = 	array(
		'name'              => esc_attr__('Portfolio Category', 'tmte'),
		'singular_name'     => esc_attr__('Portfolio Category', 'tmte'),
		'search_items'      => esc_attr__('Search Portfolio Category', 'tmte'),
		'all_items'         => esc_attr__('All Portfolio Category', 'tmte'), 
		'parent_item'       => esc_attr__('Parent Portfolio Category', 'tmte'),
		'parent_item_colon' => esc_attr__('Parent Portfolio Category:', 'tmte'), 
		'edit_item'         => esc_attr__('Edit Portfolio Category', 'tmte'),
		'update_item'       => esc_attr__('Update Portfolio Category', 'tmte'),
		'add_new_item'      => esc_attr__('Add New Portfolio Category', 'tmte'),
		'new_item_name'     => esc_attr__('New Portfolio Category Name', 'tmte'),
		'menu_name'         => esc_attr__('Portfolio Category', 'tmte'),
	);
	
	

	if($pf_cat_title != '' && $pf_cat_title != esc_attr__('Portfolio Category', 'tmte')){
		
		$labels = array(
			'name'              => sprintf( esc_attr__('%s', 'tmte'), $pf_cat_title ),
			'singular_name'     => sprintf( esc_attr__('%s', 'tmte'), $pf_cat_title_singular ),
			'search_items'      => sprintf( esc_attr__('Search %s', 'tmte'), $pf_cat_title ),
			'all_items'         => sprintf( esc_attr__('All %s', 'tmte'), $pf_cat_title ),
			'parent_item'       => sprintf( esc_attr__('Parent %s', 'tmte'), $pf_cat_title_singular ),
			'parent_item_colon' => sprintf( esc_attr__('Parent %s:', 'tmte'), $pf_cat_title_singular ),
			'edit_item'         => sprintf( esc_attr__('Edit %s', 'tmte'), $pf_cat_title_singular ),
			'update_item'       => sprintf( esc_attr__('Update %s', 'tmte'), $pf_cat_title_singular ),
			'add_new_item'      => sprintf( esc_attr__('Add New %s', 'tmte'), $pf_cat_title_singular ),
			'new_item_name'     => sprintf( esc_attr__('New %s Name', 'tmte'), $pf_cat_title_singular ),
			'menu_name'         => sprintf( esc_attr__('%s', 'tmte'), $pf_cat_title_singular ),
		);
	}
	
	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => $pf_cat_slug ),
	);
	
	register_taxonomy( 'tm_portfolio_category', 'tm_portfolio', $args  );
	
	
}

add_action( 'init', 'themetechmount_fixtech_cpt_tm_portfolio', 8 );







// Show Featured image in the admin section
add_filter( 'manage_tm_portfolio_posts_columns', 'themetechmount_tm_portfolio_set_featured_image_column' );
add_action( 'manage_tm_portfolio_posts_custom_column' , 'themetechmount_tm_portfolio_set_featured_image_column_content', 10, 2 );
if ( ! function_exists( 'themetechmount_tm_portfolio_set_featured_image_column' ) ) {
function themetechmount_tm_portfolio_set_featured_image_column($columns) {
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
if ( ! function_exists( 'themetechmount_tm_portfolio_set_featured_image_column_content' ) ) {
function themetechmount_tm_portfolio_set_featured_image_column_content( $column, $post_id ) {
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
 *  Meta Boxes: Portfolio
 */
if ( ! function_exists( 'themetechmount_fixtech_tm_portfolio_metabox_options' ) ) {
function themetechmount_fixtech_tm_portfolio_metabox_options( $options ) {
	
	// Praparing List options array
	$fixtech_theme_options = get_option('fixtech_theme_options');
	
	//
	//$pf_type_title          = ( !empty($fixtech_theme_options['pf_type_title']) ) ? $fixtech_theme_options['pf_type_title'] : 'Portfolio' ;
	$pf_type_title_singular = ( !empty($fixtech_theme_options['pf_type_title_singular']) ) ? $fixtech_theme_options['pf_type_title_singular'] : 'Portfolio' ;
	//$pf_type_slug           = ( !empty($fixtech_theme_options['pf_type_slug']) ) ? $fixtech_theme_options['pf_type_slug'] : 'portfolio' ;
	
	//$pf_cat_title          = ( !empty($fixtech_theme_options['pf_cat_title']) ) ? $fixtech_theme_options['pf_cat_title'] : 'Portfolio Categories' ;
	//$pf_cat_title_singular = ( !empty($fixtech_theme_options['pf_cat_title_singular']) ) ? $fixtech_theme_options['pf_cat_title_singular'] : 'Portfolio Category' ;
	//$pf_cat_slug           = ( !empty($fixtech_theme_options['pf_cat_slug']) ) ? $fixtech_theme_options['pf_cat_slug'] : 'portfolio-category' ;
	
	
	
	$post_id = !empty($_GET['post']) ? $_GET['post'] : get_the_ID() ;
	
	
	$list_array    = array();
	$options_array = array();
	if( isset($fixtech_theme_options['pf_details_line']) && is_array($fixtech_theme_options['pf_details_line']) && count( $fixtech_theme_options['pf_details_line'] ) > 0 ){
		foreach( $fixtech_theme_options['pf_details_line'] as $key=>$val ){
			
			// Icon classs
			$icon_class = $val['pf_details_line_icon']['library_' . $val['pf_details_line_icon']['library'] ];
			
			$option_array = array(
				'id'         => 'pf_details_line_'.$key,
				'type'       => 'text',
				'title'      => '<span class="tm-admin-pf-list-icon"> <i class="'. $icon_class .'"></i></span> &nbsp; '. esc_attr__($val['pf_details_line_title'], 'fixtech'),
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
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_portfolio_category', '', ', ', '' ) );
					break;
				
				
				case 'category_link' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['wrap_class'] = 'tm-input-style-link';
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_portfolio_category', '', ', ', '' ) );
					break;
					
				case 'tag' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['wrap_class'] = 'tm-input-style-text';
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_portfolio_tags', '', ', ', '' ) );
					break;
					
				case 'tag_link' :
					$option_array['type']       = 'text';
					$option_array['attributes'] = array( 'readonly'  => 'only-key' );
					$option_array['wrap_class'] = 'tm-input-style-link';
					$option_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_portfolio_tags', '', ', ', '' ) );
					break;
					
			}
			
			// merging with main array
			$options_array[] = $option_array;
			
		}
	}
	
	
	
	if( count($options_array)==0 ){
		// No options created in Portfolio Settings section.
		$list_array[] = array(
			'type'    => 'notice',
			'class'   => 'success',
			'content' => esc_attr__('There is no option to show. Please create some options from "Theme Options > Portfolio Settings" section.', 'tmte'),
		);
	} else {
		
		// Options created in Portfolio Settings section.
		$list_array = $options_array;
		
	}
	
	
	
	
	

	
	// Portfolio List options
	$options[]    = array(
		'id'        => 'themetechmount_portfolio_list_data',
		'title'     => sprintf( esc_attr__('Fixtech: %s List Options', 'tmte'), $pf_type_title_singular ),
		'post_type' => 'tm_portfolio', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_pf_list_data',
				'fields' => array(
		
					array(
						'id'        => 'tm_pf_list_data',
						'type'      => 'fieldset',
						'title'     => esc_attr__('List Values','tmte'),
						'fields'    => $list_array,
						//'debug'     => true
						'after'   		=> '<br><div class="cs-text-muted">'.__('You can add values of this each line and the line will appear on front side. The empty value line will be hidden.', 'tmte'). '<br>' . sprintf( esc_attr__('You can manage (change icon or title of the line) from "Theme Opitons > %s Settings" section.', 'tmte'), $pf_type_title_singular ).'</div>',
					),
					
				),
			),
		),
	);
	
	
	
	// Portfolio Featured Image / Video / Slider Metabox
	$options[]    = array(
		'id'        => 'themetechmount_portfolio_featured',
		'title'     => esc_attr__('Fixtech: Featured Image / Video / Slider', 'tmte'),
		'post_type' => 'tm_portfolio', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_pf_featured',
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
	
	
	
	// Portfolio View Style Meta Box
	$options[]    = array(
		'id'        => 'themetechmount_portfolio_view',
		'title'     => sprintf( esc_attr__('Fixtech: %s View Style', 'tmte'), $pf_type_title_singular ),
		'post_type' => 'tm_portfolio', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_pf_view',
				'fields' => array(
		
					array(
						'id'       		=> 'viewstyle',
						'type'     		=> 'radio',
						'title'    		=> sprintf( esc_attr__('%s View Style', 'tmte'), $pf_type_title_singular ),
						'options'       => array(
									''     			=> esc_attr__('Global', 'tmte'),
									'left' 			=> esc_attr__('Left image and right content (default)', 'tmte'),
									'top'  			=> esc_attr__('Top image and bottom content', 'tmte'),
									'full' 			=> esc_attr__('No image and full-width content (without details box)', 'tmte'),
									'full-withimg'  => esc_attr__('Top image and full-width content (without details box)', 'tmte'),
										),
						'default'		=> '',
						'after'   		=> '<div class="cs-text-muted">' . sprintf( esc_attr__('Select view for single %s', 'tmte'), $pf_type_title_singular ) . '</div>',
					),
				),
			),
		),
	);
	
	
	
	// Portfolio Reset Likes metabox

	$options[]    = array(
		'id'        => 'themetechmount_portfolio_like',
		'title'     => esc_attr__('Fixtech: Portfolio Like Option','tmte'),
		'post_type' => 'tm_portfolio', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_portfolio_resetlike',
				'fields' => array(
		
					array(
						'id'       		=> 'pflikereset',
						'type'     		=> 'checkbox',
						'title'    		=> esc_attr__('Portfolio Reset Likes', 'tmte'),
						'options'  		=> array(
											'header'  => esc_attr__('YES, Reset Likes', 'tmte'),	
										),
						'after'   		=> '<div class="cs-text-muted">'.__('This will make the LIKE count to zero. For this portfolio only. If you like to reset LIKE for all portfolio than please go to "Theme Options > Advanced Settings" section', 'tmte').'<br><br>'.'To reset, just check this checkbox and save this page.'.'</div>',
					),
				),
			),
		),
	);

	
	return $options;
}
}
add_filter( 'cs_metabox_options', 'themetechmount_fixtech_tm_portfolio_metabox_options' );