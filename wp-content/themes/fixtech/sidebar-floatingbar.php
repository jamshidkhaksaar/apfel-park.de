<?php
/**
 * The sidebar containing the footer widget area
 *
 * If no active widgets in this sidebar, hide it completely.
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */

 
global $fixtech_theme_options;

$floatingbar_col = '3_3_3_3';
if( !empty($fixtech_theme_options['fbar_widget_column_layout']) ){
	$floatingbar_col = esc_attr($fixtech_theme_options['fbar_widget_column_layout']);
}
?>

<div id="floatingbar-widgets" class="row multi-columns-row sidebar-container floatingbar-text-color-<?php echo sanitize_html_class($fixtech_theme_options['fbar_text_color']); ?>" role="complementary">

<div class="floatingbar-widgets-inner">

<?php
if($floatingbar_col == '3_3_3_3'){
	?>
		
		<?php if ( is_active_sidebar( 'floating-widgets-1' ) ) : ?>
		<div class="widget-area col-xs-12 col-sm-6 col-md-3 col-lg-3">
			<?php dynamic_sidebar( 'floating-widgets-1' ); ?>
		</div><!-- .widget-area -->
		<?php endif; ?>
		
		<?php if ( is_active_sidebar( 'floating-widgets-2' ) ) : ?>
		<div class="widget-area col-xs-12 col-sm-6 col-md-3 col-lg-3">
			<?php dynamic_sidebar( 'floating-widgets-2' ); ?>
		</div><!-- .widget-area -->
		<?php endif; ?>
		
		<?php if ( is_active_sidebar( 'floating-widgets-3' ) ) : ?>
		<div class="widget-area col-xs-12 col-sm-6 col-md-3 col-lg-3">
			<?php dynamic_sidebar( 'floating-widgets-3' ); ?>
		</div><!-- .widget-area -->
		<?php endif; ?>
		
		<?php if ( is_active_sidebar( 'floating-widgets-4' ) ) : ?>
		<div class="widget-area col-xs-12 col-sm-6 col-md-3 col-lg-3">
			<?php dynamic_sidebar( 'floating-widgets-4' ); ?>
		</div><!-- .widget-area -->
		<?php endif; ?>
		
		

	
	
	<?php
} else {

	$floatingbar_col = explode('_', $floatingbar_col);
	if( is_array($floatingbar_col) && count($floatingbar_col)>0 ){

		$x = 1;
		foreach($floatingbar_col as $col){
			
			// ROW width class
			$row_class = 'col-xs-12 col-sm-'.$col.' col-md-'.$col.' col-lg-'.$col;
			
			
			if ( is_active_sidebar( 'floating-widgets-'.$x ) ) : ?>
			
			<div class="widget-area <?php echo themetechmount_sanitize_html_classes($row_class); ?> first-widget-area">
				<?php dynamic_sidebar( 'floating-widgets-'.$x ); ?>
			</div><!-- .widget-area -->
			
			<?php endif;
			
			$x++;
		} // Foreach
		
		
	} // If

} // if

?>

</div><!-- .floatingbar-widgets-inner -->

</div><!-- #floatingbar-widgets -->
