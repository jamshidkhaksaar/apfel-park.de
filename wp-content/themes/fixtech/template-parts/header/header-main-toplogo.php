<div id="site-header" class="site-header <?php echo themetechmount_sanitize_html_classes(themetechmount_header_class()); ?>">
		<div class="site-header-main tm-wrap">
		
		<div class="tm-header-top-wrapper <?php echo themetechmount_sanitize_html_classes(themetechmount_header_container_class()); ?>">
			<div>
				<div class="col-xs-12 col-sm-4 col-md-3">
					<?php themetechmount_toplogo_header_leftcontent(); ?>		
				</div>
				<div class="col-xs-12 col-sm-4 col-md-6">
					<div class="text-center">
						<div class="site-branding">
							<?php echo themetechmount_site_logo(); ?>
						</div><!-- .site-branding -->
					</div>
				</div>
				<div class="col-xs-12 col-sm-4 col-md-3">
					<?php themetechmount_toplogo_header_rightcontent(); ?>		
				</div>
			</div>	
		</div><!-- .tm-header-top-wrapper -->

		<div id="tm-stickable-header-w" class="tm-stickable-header-w tm-bgcolor-<?php echo themetechmount_get_option('header_bg_color'); ?>" style="height:<?php echo themetechmount_header_menuarea_height(); ?>px">
			<div id="site-header-menu" class="site-header-menu">
				<div class="site-header-menu-inner <?php echo sanitize_html_class(themetechmount_sticky_header_class()); ?> <?php echo themetechmount_sanitize_html_classes(themetechmount_header_menu_class()); ?>">
					<div class="<?php echo themetechmount_sanitize_html_classes(themetechmount_header_container_class()); ?> ">
						<div class="site-header-menu-middle <?php echo themetechmount_sanitize_html_classes(themetechmount_header_menu_class()); ?>">
							<div>
								<nav id="site-navigation" class="main-navigation" aria-label="Primary Menu" data-sticky-height="<?php echo esc_attr(themetechmount_get_option('header_height_sticky')); ?>">		                        
									<?php get_template_part('template-parts/header/header','menu'); ?>
									<div class="kw-phone">
										<?php echo themetechmount_wp_kses( themetechmount_header_links(), 'header_links' ); ?>
									</div>
									
								</nav><!-- .main-navigation -->
								
							</div>
						</div>
				</div>				
			</div><!-- .site-header-menu -->
		</div>		
		<?php themetechmount_one_page_site_js(); ?>	
		</div>		
	</div><!-- .site-header-main -->
</div>

