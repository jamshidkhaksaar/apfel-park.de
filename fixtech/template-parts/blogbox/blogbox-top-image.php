<article class="themetechmount-box themetechmount-box-blog themetechmount-box-topimage themetechmount-blogbox-format-<?php echo get_post_format() ?> <?php echo themetechmount_sanitize_html_classes(themetechmount_post_class()); ?>">
	<div class="post-item">
		<div class="themetechmount-box-content">		
			<div class="tm-featured-outer-wrapper tm-post-featured-outer-wrapper">
				<?php echo themetechmount_get_featured_media( '', 'themetechmount-img-blog-top' ); // Featured content ?>
				<div class="tm-post-readmore">
					<a href="<?php the_permalink(); ?>"><i class="fa fa-arrow-right"></i></a>
				</div>
			</div>		
			<div class="themetechmount-box-desc">
				<div class="entry-header">
					<?php echo themetechmount_box_title(); ?>
					<?php echo fixtech_entry_meta(); ?>
				</div>				
			</div>
        </div>
	</div>
</article>
