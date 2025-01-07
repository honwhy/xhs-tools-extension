export const collectComments = async (executeStatus) => {
  try {
    let prevBatchLastCommentId = null;
    let comments = [];
    const commentContainer = document.querySelector('.comments-container');
    while (true || executeStatus === 'running') {
      console.log('Collecting comments...');
      const parentComments = document.querySelectorAll('.parent-comment');
      if (!parentComments || parentComments.length === 0) {
        break;
      }
      console.log('准备采集');
      const lastParentComment = parentComments[parentComments.length - 1];
      const lastCommentItem = lastParentComment.querySelector('.comment-item');
      const lastCommentId = lastCommentItem.getAttribute('id');
      // 检测采集的批次是不是跟上一个批次一样
      if (prevBatchLastCommentId !== lastCommentId) {
        console.log('开始采集');
        // 遍历父评论
        for (let i = 0; i < parentComments.length; i++) {
          const parentComment = parentComments[i];
          try {
            const comment = await handleParentComment(parentComment);
            console.log('Comment:', comment);
            comments.push(comment);
          } catch (err) {
            console.error('Error handling parent comment:', err);
          }
          if (i / 5 === 0) {
            scrollDown();
          }
        }
        console.log('已完成一轮采集');
      }
      prevBatchLastCommentId = lastCommentId;

      const endContainer = commentContainer.querySelector('.end-container');
      if (endContainer) {
        break;
      }

      // 等待一段时间，模拟延时
      await new Promise((resolve) =>
        setTimeout(resolve, (Math.random() * 3 + 1) * 1000 + 2000)
      );

      // 滚动容器元素
      scrollDown();
    }

    // TODO 对comments去重处理
    comments = dedupeById(comments);

    console.log('Finished collecting comments!');
    console.log('Comments: ', comments);
    return true;
  } catch (err) {
    console.error('Error collecting comments:', err);
    return false;
  }
};

const handleParentComment = async (parentComment) => {
  try {
    const commentItem = parentComment.querySelector('.comment-item');

    const comment = getCommentInfo(commentItem);

    let subComments = [];
    const replyContainer = parentComment.querySelector('.reply-container');
    if (replyContainer) {
      subComments = await handleMoreSubComments(replyContainer);
      // TODO 根据id字段对subComments进行去重
      subComments = dedupeById(subComments);
    }

    return {
      ...comment,
      subComments,
    };
  } catch (err) {
    console.error('Error handling parent comment:', err);
    throw err; // 抛出异常
  }
};

const handleMoreSubComments = async (replyContainer, showCount = 0) => {
  const subComments = [];
  const subCommentNodes = replyContainer.querySelectorAll('.comment-item-sub');
  if (!subCommentNodes || subCommentNodes.length === 0) return subComments;

  subCommentNodes.forEach((subCommentNode) => {
    const comment = getCommentInfo(subCommentNode);
    subComments.push({
      ...comment,
    });
  });

  try {
    if (showCount > 0) {
      scrollDown();
      await new Promise((resolve) =>
        setTimeout(resolve, (Math.random() * 2 + 1) * 500)
      );
    }

    const showMore = replyContainer.querySelector('.show-more');
    if (showMore) {
      showMore.click();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // 确保递归的异步调用等待结果
      const moreSubComments = await handleMoreSubComments(
        replyContainer,
        ++showCount
      );
      moreSubComments.forEach((comment) => subComments.push(comment)); // 将新的子评论合并
    }
    console.log('Sub-comments:', subComments);
  } catch (err) {
    console.error('Error handling sub-comments:', err);
  }

  return subComments;
};

const scrollDown = (topHeight = 500) => {
  const scrollElement = document.querySelector('.note-scroller');
  if (scrollElement) {
    console.log('Scrolling...');
    scrollElement.scrollBy({
      top: topHeight,
      left: 0,
      behavior: 'smooth',
    });
  } else {
    console.error('Scroll element not found!');
  }
};

const dedupeById = (comments) => {
  return comments.filter(
    (item, index, array) => array.findIndex((el) => el.id === item.id) === index
  );
};

const getCommentInfo = (commentItem) => {
  const commentId = commentItem.getAttribute('id');
  const commentTextNode = commentItem.querySelector('.note-text');
  const commentText = commentTextNode?.textContent;
  const authorNode = commentItem.querySelector('.author > a');
  const author = authorNode?.textContent;
  const profileUrl = authorNode.getAttribute('href');
  const location = commentItem.querySelector('.location')?.textContent;
  return {
    id: commentId,
    text: commentText,
    author,
    profileUrl,
    location,
  };
};
