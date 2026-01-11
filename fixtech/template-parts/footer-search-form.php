<?php
global $fixtech_theme_options;

$search_input = ( !empty($fixtech_theme_options['search_input']) ) ? esc_attr($fixtech_theme_options['search_input']) :  esc_attr_x("WRITE SEARCH WORD...", 'Search placeholder word', 'fixtech');

$searchform_title = ( isset($fixtech_theme_options['searchform_title']) ) ? esc_attr($fixtech_theme_options['searchform_title']) :  esc_attr_x("Hi, How Can We Help You?", 'Search form title word', 'fixtech');

if( !empty($searchform_title) ){
	$searchform_title = '<div class="tm-form-title">' . $searchform_title . '</div>';
}

if( !empty( $fixtech_theme_options['header_search'] ) && $fixtech_theme_options['header_search'] == true ){

?>
<div class="tm-overlay-serachform"></div>
<div class="tm-search-overlay">
	<div class="tm-popup-search-form">
	<div class="tm-popup-search-outer-form">
		<div class="tm-search-outer">	
			<a href="#" class="tm-icon-close" title="Close"> <i class="tm-fixtech-icon-close"></i> </a>
			<form method="get" class="tm-site-searchform" action="<?php echo esc_url( home_url() ); ?>">
				<input type="search" class="field searchform-s" name="s" placeholder="<?php echo esc_attr($search_input); ?>" />
			</form>
			<?php echo themetechmount_wp_kses($searchform_title); ?>
		</div>
	</div>
	</div>
</div>
<?php } ?>