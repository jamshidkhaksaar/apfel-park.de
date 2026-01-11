<div id="tm-stickable-header-w" class="tm-stickable-header-w tm-bgcolor-<?php echo themetechmount_get_option('header_bg_color'); ?>" style="height:<?php echo themetechmount_get_option('header_height'); ?>px">
	<div id="site-header" class="site-header <?php echo sanitize_html_class(themetechmount_sticky_header_class()); ?> <?php echo themetechmount_sanitize_html_classes(themetechmount_header_class()); ?>">	
		<div class="<?php echo themetechmount_sanitize_html_classes(themetechmount_header_container_class()); ?>">
			<div class="site-header-main tm-wrap <?php echo themetechmount_sanitize_html_classes(themetechmount_header_class()); ?>">
			
				<?php // You can use like this too - themetechmount_fbar_btn(); ?>
			
				<div class="site-branding tm-wrap-cell">
					<?php echo themetechmount_site_logo(); ?>
				</div><!-- .site-branding -->
				<div id="site-header-menu" class="site-header-menu tm-wrap-cell">
				
					<nav id="site-navigation" class="main-navigation" aria-label="Primary Menu" data-sticky-height="<?php echo esc_attr(themetechmount_get_option('header_height_sticky')); ?>">
						
						<?php echo themetechmount_wp_kses( themetechmount_header_links(), 'header_links' ); ?>
						<?php themetechmount_header_text(); ?>
						<?php get_template_part('template-parts/header/header','menu'); ?>
						
					</nav><!-- .main-navigation -->
				</div><!-- .site-header-menu -->

				<?php themetechmount_one_page_site_js(); ?>
			</div>
		</div>
		<?php get_template_part('template-parts/header/header','search-form'); ?>
		<!-- .site-header-main -->
	</div>
</div>
