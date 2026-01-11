<?php
/**
 * The sidebar containing the sidebar left (Sidebar 1).
 *
 */

global $fixtech_theme_options;


if( is_page() ){
	$sidebar_left      = 'sidebar-left-page';
	$sidebar_left_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
	if( !empty($sidebar_left_page['left_sidebar']) ){ $sidebar_left = $sidebar_left_page['left_sidebar']; }
	
	
	
	// The Events Calendar
	if( function_exists('tribe_is_upcoming') ){
		if (get_post_type()=='tribe_events'){
			$sidebar_left = 'sidebar-left-events';
		}
	}
	

} elseif( is_singular('tm_portfolio') ) {  // Portfolio
	
	$sidebar_left      = 'sidebar-left-portfolio';
	if( is_singular() ){
		$sidebar_left_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
		if( !empty($sidebar_left_page['left_sidebar']) ){ $sidebar_left = $sidebar_left_page['left_sidebar']; }
	}
	
	
} elseif( is_singular('tm_service') ) {  // Service
	

	$sidebar_left      = 'sidebar-left-service';
	$sidebar_left_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
	
	if( !empty($sidebar_left_page['left_sidebar']) ){ $sidebar_left = $sidebar_left_page['left_sidebar']; }
	
	
} elseif( is_tax('tm_portfolio_category') ) {  // Portfolio category
	$sidebar_left      = 'sidebar-left-portfoliocat';
	

} elseif( is_tax('tm_service_category') ) {  // Service category
	$sidebar_left      = 'sidebar-left-servicecat';


} elseif( is_singular('tm_team_member') ) {  // Team member
	
	$sidebar_left      = 'sidebar-left-team-member';
	if( is_singular() ){
		$sidebar_left_page = get_post_meta( get_the_ID(), '_themetechmount_metabox_sidebar', true );
		if( !empty($sidebar_left_page['left_sidebar']) ){ $sidebar_left = $sidebar_left_page['left_sidebar']; }
	}
	

	
} elseif( is_tax('tm_team_group') ) {  // Team Member Group
	$sidebar_left      = 'sidebar-left-team-member-group';



} elseif( function_exists('is_woocommerce') && ( is_woocommerce() || is_product() ) ) {
	$sidebar_left = 'sidebar-left-woocommerce';
	
	$post_id = get_option( 'woocommerce_shop_page_id' );
	if( $post_id ){
		$sidebar_left_page = get_post_meta( $post_id, '_themetechmount_metabox_sidebar', true );
		if( !empty($sidebar_left_page['left_sidebar']) ){ $sidebar_left = $sidebar_left_page['left_sidebar']; }
	}
	
} elseif( is_home() || is_single() ){  // Homepage or Single POST or Single CPT

	
	$pageid   = get_option('page_for_posts');
	$postType = 'page';
	if( is_single() ){
		global $post;
		$pageid   = $post->ID;
		$postType = 'post';
	}
	

	
	$sidebar_left      = 'sidebar-left-blog';
	$sidebar_left_blog = get_post_meta( $pageid ,'_themetechmount_'.$postType.'_options_leftsidebar',true);
	if( trim($sidebar_left_blog)!='' ){ $sidebar_left = trim($sidebar_left_blog); }
	
	
	// The Events Calendar
	if( function_exists('tribe_is_upcoming') ){
		if ( get_post_type() == 'tribe_events' || tribe_is_upcoming() || tribe_is_month() || tribe_is_by_date() || tribe_is_day() || is_single('tribe_events')){
			$sidebar_left = 'sidebar-left-events';
		}
	}
	
	// if single bbPress
	if( function_exists('is_bbpress') && is_bbpress() ) {
		$sidebar_left = 'sidebar-left-bbpress';
	}
	
	
	
} elseif( is_search() ) {
	$sidebar_left = 'sidebar-left-search';
	

	
} elseif( function_exists('is_bbpress') && is_bbpress() ) {
	$sidebar_left = 'sidebar-left-bbpress';
	
	
	
} elseif( (function_exists('tribe_is_upcoming')) && (get_post_type() == 'tribe_events' || tribe_is_upcoming() || tribe_is_month() || tribe_is_by_date() || tribe_is_day() || is_single('tribe_events'))){
	$sidebar_left = 'sidebar-left-events';

	
} else {
	
	$sidebar_left = esc_attr($fixtech_theme_options['sidebar_post']); // Global settings
	$sidebar_left = 'sidebar-left-blog';
	$sidebar_left_post = get_post_meta($post->ID,'_themetechmount_post_options_leftsidebar',true);
	if( trim($sidebar_left_post)!='' ){ $sidebar_left = trim($sidebar2_post); }
	
}

?>

<?php if ( is_active_sidebar( $sidebar_left ) ) : ?>
<aside id="sidebar-left" class="widget-area col-md-3 col-lg-3 col-xs-12 sidebar">
	<?php dynamic_sidebar( $sidebar_left ); ?>
</aside><!-- #sidebar-left -->
<?php endif; ?>

