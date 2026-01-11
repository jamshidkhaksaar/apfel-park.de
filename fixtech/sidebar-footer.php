<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "site-content" div and all content after.
 *
 * @package WordPress
 * @subpackage Fixtech
 * @since Fixtech 1.0
 */
global $fixtech_theme_options;


?>

<div id="bottom-footer-text" class="bottom-footer-text tm-bottom-footer-text site-info <?php echo themetechmount_sanitize_html_classes(themetechmount_footer_row_class( 'bottom' )); ?>">
	<div class="bottom-footer-bg-layer tm-bg-layer"></div>
	<div class="<?php echo themetechmount_sanitize_html_classes(themetechmount_footer_container_class()); ?>">
		<div class="bottom-footer-inner">
			<div class="row multi-columns-row">
<?php
$left_content=themetechmount_footer_copyright_right();
$right_content=$fixtech_theme_options['footer_copyright_left'];
if(!empty($left_content)) { $left_col_class='col-sm-7'; } else { $left_col_class='col-sm-12'; }
if(!empty($right_content)) { $right_col_class='col-sm-5'; } else { $right_col_class='col-sm-12'; }
?>
				<div class="col-xs-12 <?php echo esc_attr($left_col_class); ?> <?php if(!empty($right_content)) { ?>tm-footer2-left <?php } ?>">
					<?php
					if( !empty($fixtech_theme_options['footer_copyright_left']) ){
					echo do_shortcode( $fixtech_theme_options['footer_copyright_left'] );
					}
					?>
				</div><!--.footer menu -->

				<div class="col-xs-12 <?php echo esc_attr($right_col_class); ?> <?php if(!empty($left_content)) { ?>tm-footer2-right <?php } ?>">
					<?php echo themetechmount_wp_kses( themetechmount_footer_copyright_right() ); ?>
				</div><!--.copyright --> 

			</div><!-- .row.multi-columns-row --> 
		</div><!-- .bottom-footer-inner --> 
	</div><!--  --> 
</div><!-- .footer-text -->