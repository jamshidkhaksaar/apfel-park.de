<?php 

function themetechmount_fixtech_cpt_tm_team(){

	// Getting Options
	$fixtech_theme_options = get_option('fixtech_theme_options');
	
	$team_type_title          = ( !empty($fixtech_theme_options['team_type_title']) ) ? $fixtech_theme_options['team_type_title'] : 'Team Members' ;
	$team_type_title_singular = ( !empty($fixtech_theme_options['team_type_title_singular']) ) ? $fixtech_theme_options['team_type_title_singular'] : 'Team Member' ;
	$team_type_slug           = ( !empty($fixtech_theme_options['team_type_slug']) ) ? $fixtech_theme_options['team_type_slug'] : 'team-member' ;
	
	$team_group_title          = ( !empty($fixtech_theme_options['team_group_title']) ) ? $fixtech_theme_options['team_group_title'] : 'Team Groups' ;
	$team_group_title_singular = ( !empty($fixtech_theme_options['team_group_title_singular']) ) ? $fixtech_theme_options['team_group_title_singular'] : 'Team Group' ;
	$team_cat_slug           = ( !empty($fixtech_theme_options['team_cat_slug']) ) ? $fixtech_theme_options['team_cat_slug'] : 'team-group' ;
	
	
	
	
	/*
	 *  Custom Post Type
	 */
	$labels = array(
		'name'               => esc_attr_x( 'Team Members', 'Team Member CPT general name', 'tmte' ),
		'singular_name'      => esc_attr_x( 'Team Member', 'Team Member CPT singular name', 'tmte' ),
		'menu_name'          => esc_attr_x( 'Team Member', 'Team Member CPT admin menu', 'tmte' ),
		'name_admin_bar'     => esc_attr_x( 'Team Member', 'Team Member CPT add new on admin bar', 'tmte' ),
		'add_new'            => esc_attr_x( 'Add New', 'Team Member CPT', 'tmte' ),
		'add_new_item'       => esc_attr__( 'Add New Team Member', 'tmte' ),
		'new_item'           => esc_attr__( 'New Team Member', 'tmte' ),
		'edit_item'          => esc_attr__( 'Edit Team Member', 'tmte' ),
		'view_item'          => esc_attr__( 'View Team Member', 'tmte' ),
		'all_items'          => esc_attr__( 'All Team Members', 'tmte' ),
		'search_items'       => esc_attr__( 'Search Team Member', 'tmte' ),
		'parent_item_colon'  => esc_attr__( 'Parent Team Member:', 'tmte' ),
		'not_found'          => esc_attr__( 'No team member found.', 'tmte' ),
		'not_found_in_trash' => esc_attr__( 'No team member found in Trash.', 'tmte' )
	);
	
	
	
	if( $team_type_title!='Team Members' || $team_type_title_singular!='Team Member' ){
		
		$labels = array(
			'name'               => esc_attr_x( $team_type_title, 'post type general name', 'tmte' ),
			'singular_name'      => esc_attr_x( $team_type_title_singular, 'post type singular name', 'tmte' ),
			'menu_name'          => esc_attr_x( $team_type_title_singular, 'admin menu', 'tmte' ),
			'name_admin_bar'     => esc_attr_x( $team_type_title_singular, 'add new on admin bar', 'tmte' ),
			'add_new'            => esc_attr_x( 'Add New', 'Team Member CPT', 'tmte' ),
			'add_new_item'       => esc_attr__( 'Add New '.$team_type_title_singular, 'tmte' ),
			'new_item'           => esc_attr__( 'New '.$team_type_title_singular, 'tmte' ),
			'edit_item'          => esc_attr__( 'Edit '.$team_type_title_singular, 'tmte' ),
			'view_item'          => esc_attr__( 'View '.$team_type_title_singular, 'tmte' ),
			'all_items'          => esc_attr__( 'All '.$team_type_title, 'tmte' ),
			'search_items'       => esc_attr__( 'Search '.$team_type_title_singular, 'tmte' ),
			'parent_item_colon'  => esc_attr__( 'Parent '.$team_type_title_singular.':', 'tmte' ),
			'not_found'          => esc_attr__( 'No '.$team_type_title_singular.' found.', 'tmte' ),
			'not_found_in_trash' => esc_attr__( 'No '.$team_type_title_singular.' found in Trash.', 'tmte' )
		);
	}
	
	
	$args = array(
		'labels'             => $labels,
		'menu_icon'          => 'dashicons-groups',
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'with_front' => false, 'slug' => $team_type_slug ),
		'capability_type'    => 'post',
		'has_archive'        => false,
		'hierarchical'       => false,
		'menu_position'      => null,
		'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
	);

	register_post_type( 'tm_team_member', $args );
	
	
	
	
	
	//Taxonomy 
	
	$labels = 	array(
		'name'              => esc_attr_x( 'Team Group', 'taxonomy general name', 'tmte' ),
		'singular_name'     => esc_attr_x( 'Team Group', 'taxonomy singular name', 'tmte' ),
		'search_items'      => esc_attr__( 'Search Group', 'tmte' ),
		'all_items'         => esc_attr__( 'All Team Groups', 'tmte' ),
		'parent_item'       => esc_attr__( 'Parent Group', 'tmte' ),
		'parent_item_colon' => esc_attr__( 'Parent Group:', 'tmte' ),
		'edit_item'         => esc_attr__( 'Edit Group', 'tmte' ),
		'update_item'       => esc_attr__( 'Update Group', 'tmte' ),
		'add_new_item'      => esc_attr__( 'Add New Group', 'tmte' ),
		'new_item_name'     => esc_attr__( 'New Group Name', 'tmte' ),
		'menu_name'         => esc_attr__( 'Team Group', 'tmte' ),
	);
	

	if( $team_group_title != esc_attr__('Team Groups', 'tmte') || $team_group_title_singular != esc_attr__('Team Group', 'tmte') ){
		
		$labels = array(
			'name'              => sprintf( esc_attr__('%s', 'tmte'), $team_group_title ),
			'singular_name'     => sprintf( esc_attr__('%s', 'tmte'), $team_group_title_singular ),
			'search_items'      => sprintf( esc_attr__('Search %s', 'tmte'), $team_group_title ),
			'all_items'         => sprintf( esc_attr__('All %s', 'tmte'), $team_group_title ),
			'parent_item'       => sprintf( esc_attr__('Parent %s', 'tmte'), $team_group_title_singular ),
			'parent_item_colon' => sprintf( esc_attr__('Parent %s:', 'tmte'), $team_group_title_singular ),
			'edit_item'         => sprintf( esc_attr__('Edit %s', 'tmte'), $team_group_title_singular ),
			'update_item'       => sprintf( esc_attr__('Update %s', 'tmte'), $team_group_title_singular ),
			'add_new_item'      => sprintf( esc_attr__('Add New %s', 'tmte'), $team_group_title_singular ),
			'new_item_name'     => sprintf( esc_attr__('New %s Name', 'tmte'), $team_group_title_singular ),
			'menu_name'         => sprintf( esc_attr__('%s', 'tmte'), $team_group_title_singular ),
		);
	}
	

	$args = array(
		'hierarchical'      => true,
		'labels'            => $labels,
		'show_ui'           => true,
		'show_admin_column' => true,
		'query_var'         => true,
		'rewrite'           => array( 'slug' => $team_cat_slug ),
	);
	
	register_taxonomy( 'tm_team_group', 'tm_team_member', $args  );

	
	
	// Move Featured Image box from left to center only on CLIENTS custom_post_type
	add_action('do_meta_boxes', 'themetechmount_fixtech_tm_team_featured_image_box');
	function themetechmount_fixtech_tm_team_featured_image_box() {
		
		$fixtech_theme_options = get_option('fixtech_theme_options');
		$team_type_title_singular = ( !empty($fixtech_theme_options['team_type_title_singular']) ) ? $fixtech_theme_options['team_type_title_singular'] : 'Team Member' ;
		
		remove_meta_box( 'postimagediv', 'tm_team_member', 'normal' );
		add_meta_box('postimagediv', sprintf( esc_attr__("%s's Image",'tmte'), $team_type_title_singular ), 'post_thumbnail_meta_box', 'tm_team_member', 'normal', 'high');
	}


}
add_action( 'init', 'themetechmount_fixtech_cpt_tm_team', 8 );








// Show Featured image in the admin section
add_filter( 'manage_tm_team_member_posts_columns', 'themetechmount_tm_team_member_set_featured_image_column' );
add_action( 'manage_tm_team_member_posts_custom_column' , 'themetechmount_tm_team_member_set_featured_image_column_content', 10, 2 );
if ( ! function_exists( 'themetechmount_tm_team_member_set_featured_image_column' ) ) {
function themetechmount_tm_team_member_set_featured_image_column($columns) {
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
if ( ! function_exists( 'themetechmount_tm_team_member_set_featured_image_column_content' ) ) {
function themetechmount_tm_team_member_set_featured_image_column_content( $column, $post_id ) {
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
 *  Meta Box: Team
 */
if ( ! function_exists( 'themetechmounttmte_fixtech_tm_team_metabox_options' ) ) {
function themetechmounttmte_fixtech_tm_team_metabox_options( $options ) {
	
	
	// Getting Options
	$fixtech_theme_options = get_option('fixtech_theme_options');
	
	$team_type_title_singular = ( !empty($fixtech_theme_options['team_type_title_singular']) ) ? $fixtech_theme_options['team_type_title_singular'] : 'Team Member' ;
	
	$team_extra_details_lines  = ( !empty($fixtech_theme_options['team_extra_details_lines']) ) ? $fixtech_theme_options['team_extra_details_lines'] : array() ;
	
	// Default options - Team Member details
	$list_array = array(
		array(
			'type'    => 'subheading',
			'content' => sprintf( esc_attr__('%s\'s General Details','tmte'), $team_type_title_singular ),
		),
		 array (
			"id"    => "team_details_line_position",
			"type"  => "text",
			"title" => '<span class="tm-admin-team-list-icon"> <i class="fa fa-pencil"></i></span> &nbsp; '.__('Position', 'tmte'),
		),
		array (
			"id"    => "team_details_line_email",
			"type"  => "text",
			"title" => '<span class="tm-admin-team-list-icon"> <i class="fa fa-envelope"></i></span> &nbsp; '.__('Email', 'tmte'),
		),
		array(
			"id"    => "team_details_line_phone",
			"type"  => "text",
			"title" => '<span class="tm-admin-team-list-icon"> <i class="fa fa-phone"></i></span> &nbsp; '.__('Phone', 'tmte'),
		),
		array(
			"id"    => "team_details_line_website",
			"type"  => "text",
			"title" => '<span class="tm-admin-team-list-icon"> <i class="fa fa-link"></i></span> &nbsp; '.__('Website', 'tmte'),
		)
	);
	
	
	
	// Team Member Extra Details
	$extra_details_info = sprintf( esc_attr__('You can add extra lines from Theme Opitons > %s Settings" section.', 'tmte'), $team_type_title_singular );
	
	$post_id = !empty($_GET['post']) ? $_GET['post'] : get_the_ID() ;
	
	if( is_array($team_extra_details_lines) && count($team_extra_details_lines) > 0 ){
		
		$extra_details_info = '<br><div class="cs-text-muted">' . sprintf( esc_attr__('%s\'s Extra Details: You can add values of this each line and the line will appear on front side. The empty value line will be hidden.', 'tmte'), $team_type_title_singular ) . '<br>' .
		sprintf( esc_attr__('You can manage (change icon or title of the line) from Theme Opitons > %s Settings" section.', 'tmte'), $team_type_title_singular ) . '</div>';
		
		$list_array[] = array(
			'type'    => 'subheading',
			'content' => sprintf( esc_attr__('%s\'s Extra Details','tmte'), $team_type_title_singular ),
		);
		
		foreach( $fixtech_theme_options['team_extra_details_lines'] as $key=>$val ){
			
			// Icon classs
			$icon_class = $val['team_extra_details_line_icon']['library_' . $val['team_extra_details_line_icon']['library'] ];
			
			$this_array = array();
			$this_array['id']    = 'team_extra_details_line_'.$key;
			$this_array['type']  = 'text';
			$this_array['title'] = '<span class="tm-admin-team-list-icon"> <i class="'. $icon_class .'"></i></span> &nbsp; '. esc_attr__($val['team_extra_details_line_title'], 'fixtech');
			$this_array['after'] = '<div class="cs-text-muted">'. sprintf( esc_attr__('This extra field is added from "Theme Options > %s Settings" section. You can manage this field from that section.','tmte'), $team_type_title_singular ) .'</div>';
			
			
			if( $val['data']=='date' ){  // Date
				$this_array['attributes'] = array( 'readonly' => 'only-key' );
				$this_array['value']      = get_the_date( '', $post_id );
				
			} else if( $val['data']=='category' ){  // Category
				$this_array['attributes'] = array( 'readonly' => 'only-key' );
				$this_array['value']      = strip_tags( get_the_term_list( $post_id, 'tm_portfolio_category', '', ', ', '' ) );
				
			}
			
			$list_array[] = $this_array;
		}
	}
	
	
	
	
	// Team Members Details
	$options[]    = array(
		'id'        => 'themetechmount_team_member_details',
		'title'     => sprintf( esc_attr__("Fixtech: %s's Details", 'tmte'), $team_type_title_singular ),
		'post_type' => 'tm_team_member', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			array(
				'name'   => 'themetechmount_team_list_data',
				'fields' => array(
					array(
						'id'        => 'tm_team_info',
						'type'      => 'fieldset',
						//'title'     => esc_attr__('List Values','tmte'),
						'fields'    => $list_array,
						'after'   	=> '<br><div class="cs-text-muted"><strong>' . sprintf( esc_attr__('%s\'s General Details:', 'tmte'), $team_type_title_singular ) . '</strong> ' . esc_attr__('You can add values of this each line and the line will appear on front side. The empty value line will be hidden.', 'tmte'). '<br></div>' . $extra_details_info,
						
					),
				),
			),
		),
	);
	
	
	
	
	// Team Members Details
	$options[]    = array(
		'id'        => 'themetechmount_team_member_social',
		'title'     => sprintf( esc_attr__("Fixtech: %s's Social Links", 'tmte'), $team_type_title_singular ),
		'post_type' => 'tm_team_member', // only here is important
		'context'   => 'normal',
		'priority'  => 'default',
		'sections'  => array(
			
			//Team Members Social Links
			array(
				'name'   => 'themetechmount_team_socials',
				//'title'  => esc_attr__("Team Member's Social Links", 'tmte'),
				'fields' => array(
					array(
						'id'              => 'social_icons_list',
						'type'            => 'group',
						'title'           => esc_attr__('Social Links', 'fixtech'),
						'info'            => esc_attr__('Add your social services here. Also you can reorder the Social Links as per your choice. Just drag and drop items to reorder and save settings', 'fixtech'),
						'button_title'    => esc_attr__('Add New Social Links', 'fixtech'),
						'accordion_title' => 'social_icons_list_icon',
						'fields'          => array(
							array(
								'id'            => 'social_icons_list_icon',
								'type'          => 'select',
								'title'         =>  esc_attr__('Social Sevice', 'fixtech'),
								'options'  		=> array(
													'twitter'    => esc_attr__('Twitter', 'fixtech' ),
													'youtube'    => esc_attr__('YouTube', 'fixtech' ),
													'flickr'     => esc_attr__('Flickr', 'fixtech' ),
													'facebook'   => esc_attr__('Facebook', 'fixtech' ),
													'linkedin'   => esc_attr__('LinkedIn', 'fixtech' ),
													'gplus'      => esc_attr__('Google+', 'fixtech' ),
													'yelp'       => esc_attr__('Yelp', 'fixtech' ),
													'dribbble'   => esc_attr__('Dribbble', 'fixtech' ),
													'pinterest'  => esc_attr__('Pinterest', 'fixtech' ),
													'podcast'    => esc_attr__('Podcast', 'fixtech' ),
													'instagram'  => esc_attr__('Instagram', 'fixtech' ),
													'xing'       => esc_attr__('Xing', 'fixtech' ),
													'vimeo'      => esc_attr__('Vimeo', 'fixtech' ),
													'vk'         => esc_attr__('VK', 'fixtech' ),
													'houzz'      => esc_attr__('Houzz', 'fixtech' ),
													'issuu'      => esc_attr__('Issuu', 'fixtech' ),
													'google-drive' => esc_attr__('Google Drive', 'fixtech' ),
													'rss'        => esc_attr__('RSS', 'fixtech' ),
												),
								'class'         => 'chosen',
								'default'       => 'twitter',
								'after'  		=> '<div class="cs-text-muted"><br>'.__('Select Social service from here', 'fixtech').'</div>',
							),
							array(
								'id'     		=> 'social_icons_list_link',
								'type'    		=> 'text',
								'title'   		=> esc_attr__('Link to Social service selected above', 'fixtech'),
								'after'  		=> '<div class="cs-text-muted"><br>'. esc_attr__('Paste URL only', 'fixtech').'</div>',
								'dependency' 	=> array( 'social_icons_list_icon', '!=', 'rss' ),
							),
						)
					),
				
				),
			),
		),
	);
	
	
	
	
	
	
	
	return $options;
}
}
add_filter( 'cs_metabox_options', 'themetechmounttmte_fixtech_tm_team_metabox_options' );

