<?php
/**
 * The sidebar containing the sidebar right (Sidebar 1).
 *
 */

global $fixtech_theme_options;


if( is_page() ){

	$sidebar_right      = 'sidebar-right-page';
	$sidebar_right_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
	if( !empty($sidebar_right_page['right_sidebar']) ){ $sidebar_right = $sidebar_right_page['right_sidebar']; }
	
	
	
	// The Events Calendar
	if( function_exists('tribe_is_upcoming') ){
		if (get_post_type()=='tribe_events'){
			$sidebar_right = 'sidebar-right-events';
		}
	}
	

} elseif( is_singular('tm_portfolio') ) {  // Portfolio
	
	$sidebar_right      = 'sidebar-right-portfolio';
	if( is_singular() ){
		$sidebar_right_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
		if( !empty($sidebar_right_page['right_sidebar']) ){ $sidebar_right = $sidebar_right_page['right_sidebar']; }
	}
	
	
} elseif( is_singular('tm_service') ) {  // Service
	
	$sidebar_right      = 'sidebar-right-service';
	$sidebar_right_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
	if( !empty($sidebar_right_page['right_sidebar']) ){ $sidebar_right = $sidebar_right_page['right_sidebar']; }

		
} elseif( is_tax('tm_portfolio_category') ) {  // Portfolio category
	$sidebar_right      = 'sidebar-right-portfoliocat';
	


} elseif( is_tax('tm_service_category') ) {  // Service category
	$sidebar_right      = 'sidebar-right-servicecat';
	

} elseif( is_singular('tm_team_member') ) {  // Team member
	
	$sidebar_right      = 'sidebar-right-team-member';
	if( is_singular() ){
		$sidebar_right_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
		if( !empty($sidebar_right_page['right_sidebar']) ){ $sidebar_right = $sidebar_right_page['right_sidebar']; }
	}
	

	
} elseif( is_tax('tm_team_group') ) {  // Team Member Group
	$sidebar_right      = 'sidebar-right-team-member-group';
	
	
} elseif( function_exists('is_woocommerce') && ( is_woocommerce() || is_product() ) ) {
	$sidebar_right = 'sidebar-right-woocommerce';
	
	$post_id = get_option( 'woocommerce_shop_page_id' );
	if( $post_id ){
		$sidebar_right_page = get_post_meta( $post_id, '_themetechmount_metabox_sidebar', true );
		if( !empty($sidebar_right_page['right_sidebar']) ){ $sidebar_right = $sidebar_right_page['right_sidebar']; }
	}
	
} elseif( is_home() || is_single() ){  // Homepage or Single POST or Single CPT
	
	$pageid   = get_option('page_for_posts');
	$postType = 'page';
	if( is_single() ){
		global $post;
		$pageid   = $post->ID;
		$postType = 'post';
	}
	
	
	
	$sidebar_right      = 'sidebar-right-blog';
	$sidebar_right_blog = get_post_meta( $pageid ,'_themetechmount_'.$postType.'_options_rightsidebar',true);
	if( trim($sidebar_right_blog)!='' ){ $sidebar_right = trim($sidebar_right_blog); }
	
	
	// The Events Calendar
	if( function_exists('tribe_is_upcoming') ){
		if ( get_post_type() == 'tribe_events' || tribe_is_upcoming() || tribe_is_month() || tribe_is_by_date() || tribe_is_day() || is_single('tribe_events')){
			$sidebar_right = 'sidebar-right-events';
		}
	}
	
		// if single bbPress
	if( function_exists('is_bbpress') && is_bbpress() ) {
		$sidebar_right = 'sidebar-right-bbpress';
	}
	
	
	
} elseif( is_search() ) {
	$sidebar_right = 'sidebar-right-search';
	
	
	
} elseif( function_exists('is_bbpress') && is_bbpress() ) {
	$sidebar_right = 'sidebar-right-bbpress';
	
	
} elseif( (function_exists('tribe_is_upcoming')) && (get_post_type() == 'tribe_events' || tribe_is_upcoming() || tribe_is_month() || tribe_is_by_date() || tribe_is_day() || is_single('tribe_events'))){
	$sidebar_right = 'sidebar-right-events';

	
} else {
	
	$sidebar_right = esc_attr($fixtech_theme_options['sidebar_post']); // Global settings
	$sidebar_right = 'sidebar-right-blog';
	$sidebar_right_post = get_post_meta($post->ID,'_themetechmount_post_options_rightsidebar',true);
	if( trim($sidebar_right_post)!='' ){ $sidebar_right = trim($sidebar2_post); }
	
}

?>

<?php if ( is_active_sidebar( $sidebar_right ) ) : ?>
<aside id="sidebar-right" class="widget-area col-md-3 col-lg-3 col-xs-12 sidebar">
	<?php dynamic_sidebar( $sidebar_right ); ?>
</aside><!-- #sidebar-right -->
<?php endif; ?>

