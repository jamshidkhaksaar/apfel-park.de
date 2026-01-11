<article class="themetechmount-box themetechmount-box-testimonial themetechmount-testimonial-box-view-style2">
	<div class="themetechmount-post-item">
		<div class="themetechmount-box-content">
			<div class="themetechmount-box-content-inner">
				<div class="themetechmount-box-title"><?php echo themetechmount_testimonial_title(); ?></div>
					<div class="themetechmount-ratting-star"><?php echo themetechmount_star_ratting(); ?></div>
				<div class="themetechmount-box-desc">
					<blockquote class="themetechmount-testimonial-text"><?php echo themetechmount_wp_kses( strip_tags( get_the_content('') ) ); ?></blockquote>				
				 </div>
				<div class="themetechmount-box-author">
					<div class="themetechmount-box-img"><?php echo themetechmount_testimonial_featured_image('thumbnail') ?></div>
				</div>	
			</div>
		</div>
	</div>
</article>