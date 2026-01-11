<?php
// Check if floating bar is enabled
if( themetechmount_fbar_show()==true ): ?>
	
	<div class="themetechmount-fbar-main-w themetechmount-fbar-position-<?php echo sanitize_html_class( themetechmount_get_option('fbar-position') ); ?>">
		<div class="themetechmount-fbar-inner-w">
			<div class="themetechmount-fbar-box-w <?php echo themetechmount_sanitize_html_classes( themetechmount_fbar_classes() ); ?>">
				<div class="tm-fbar-bg-layer tm-bg-layer"></div>
				<div class="themetechmount-fbar-content-wrapper <?php echo themetechmount_sanitize_html_classes( themetechmount_floatingbar_container_class() ); ?>">
					<div class="themetechmount-fbar-box-w-bgcolor">
						<div class="themetechmount-fbar-box">
							<?php get_sidebar( 'floatingbar-top' ); ?>
							<?php get_sidebar( 'floatingbar' ); ?>
							<?php get_sidebar( 'floatingbar-bottom' ); ?>
						</div>
					</div>
					<span class="tm-fbar-close"><?php echo themetechmount_fbar_close_icon_for_content_area(); ?></span>
				</div>
			</div>
		
		</div><!-- .themetechmount-fbar-inner-w -->	
	</div><!-- .themetechmount-fbar-main-w -->
	
<?php endif; ?>