<article class="themetechmount-box themetechmount-box-blog themetechmount-blogbox-format-<?php echo get_post_format() ?> <?php echo themetechmount_sanitize_html_classes(themetechmount_post_class()); ?> themetechmount-box-view-left-image themetechmount-blog-box-view-left-image">
	<div class="post-item">
		<div class="themetechmount-box-content">
			<div class="col-md-5 themetechmount-box-img-left">
				<div class="tm-featured-outer-wrapper tm-post-featured-outer-wrapper">
					<?php echo themetechmount_get_featured_media( '', 'themetechmount-img-blog-left' ); // Featured content ?>	
					<div class="tm-post-readmore">
						<a href="<?php the_permalink(); ?>"><i class="fa fa-arrow-right"></i></a>
					</div>
				</div>
			</div>
			<div class="themetechmount-box-content col-md-7">
				<div class="themetechmount-box-content-inner">
					<div class="entry-header">				
						<?php echo themetechmount_box_title(); ?>
						<?php echo fixtech_entry_meta(); ?>
					</div>			
					<div class="themetechmount-box-desc">
						<div class="themetechmount-box-desc-text"><?php echo themetechmount_blogbox_description(); ?></div>
					</div>	
					<div class="themetechmount-blogbox-footer-readmore">
						<?php echo themetechmount_blogbox_readmore(); ?>
					</div>						
				</div>					
			</div>
		</div>
	</div>
</article>
