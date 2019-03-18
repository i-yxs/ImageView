# 移动端图像查看器，包含分页浏览、多选删除、图像截取功能
(不依赖任何库，兼容主流浏览器)

--------------------------------------
demo：
--------------------------------------
[图像列表预览](https://i-yxs.github.io/ImageView/example/demo1.html)、
[配置预览](https://i-yxs.github.io/ImageView/example/demo2.html)、
[列表删除](https://i-yxs.github.io/ImageView/example/demo3.html)、
[图像截取](https://i-yxs.github.io/ImageView/example/demo4.html)

文档：
--------------------------------------
### .show({...}) 
```javascript
{
  pattern:'default',            //模式(默认：default 可选：edit(编辑) clipping(剪裁))
  selector:'',                  //选择器(如：'#ImageList img')
  imageMargin:10,               //图片间距(默认：10)
  /*
      图像的初始显示尺寸(裁剪模式不可用)
        默认：cover
        cover (图像扩展至足够大，使图像完全覆盖显示区域) 
        contain (图像扩展至最大尺寸，使其宽度和高度完全适应显示区域)
  */
  initDisplaySize:'';
  /*
      图像的初始水平显示位置(裁剪模式不可用)
        默认：center
        top (仅当initDisplaySize='cover' 时生效)
        center (居中显示)
        bottom (仅当initDisplaySize='cover' 时生效)
  */
  initDisplayPositionX = null;
  /*
      图像的初始垂直显示位置(裁剪模式不可用)
        默认：center
        left (仅当initDisplaySize='cover' 时生效)
        center (居中显示)
        rihgt (仅当initDisplaySize='cover' 时生效)
  */
  initDisplayPositionY = null;
  isGestureRotate:true,         //手势事件是否能进行旋转(默认：false 可选：true)
  clippingWidth:[Number],       //裁剪后输出的图片宽度(默认：容器宽度)
  clippingHeight:[Number],      //裁剪后输出的图片高度(默认：容器宽度)
  clippingRadius:0,             //裁剪图片的圆角数值(默认：0)
  clippingBackground:'',        //裁剪后输出的图片背景(默认：透明)
  clippingImportSuffix:'png'    //裁剪后输出的图片后缀(默认：png 可选：jpge)
  isFindTargettoImageList:true  //当使用dom事件触发显示时，是否查找目标元素是否存在于图片列表中(默认：true 可选：false)
}
```
### .close()
`关闭图像查看器`

### .prevPage()
`(default、edit)模式时，回到到上一张图片`

### .nextPage()
`(default、edit)模式时，前进到下一张图片`

### .indexPage(index)
`(default、edit)模式时，前进到指定页码数`

--------------------------------------
事件：
--------------------------------------
### 用法
```javascript
/*
  绑定事件
  .on(...) 或
  .addEventListener(...) 或
  .on+首字母大写事件名，如.onShow=function(){...}
*/
ImageView.on('事件名', function (data) {
  ...
});
/*
  解除事件
  .off(...) 或
  .removeEventListener(...)
*/
ImageView.off('事件名', function (data) {
  ...
});
```
### 'show'
`显示动画完成时触发`
### 'close'
`关闭动画完成时触发`
### 'pageing'
`进行翻页动作时触发`
### 'delete'
`编辑模式时点击删除按钮时触发`
### 'clipping'
`剪裁模式时点击完成按钮时触发`

