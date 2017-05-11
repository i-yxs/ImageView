# 移动端图像查看器，具有分页浏览、多选删除、图像截取功能
(不依赖任何库，兼容主流浏览器)

方法：
--------------------------------------
### .show({...}) 
```javascript
{
  pattern:'default',            //模式(默认：default 可选：edit(编辑) clipping(剪裁))
  selector:'',                  //选择器(如：'#ImageList img')
  imageMargin:10,               //图片间距(默认：10)
  isGestureRotate:true,         //手势事件是否能进行旋转(默认：false 可选：true)
  clippingWidth:[width],        //裁剪后输出的图片宽度(默认：容器宽度)
  clippingHeight:[height],      //裁剪后输出的图片高度(默认：容器高度)
  clippingRadius:0,             //裁剪图片的圆角数值(默认：0)
  clippingBackground:'',        //裁剪后输出的图片背景(默认：透明)
  clippingImportSuffix:'png'    //裁剪后输出的图片后缀(默认：png 可选：jpge)
}
```

### .close(): 
`关闭图像查看器`

### .prevPage()
`(default、edit)模式时，回到到上一张图片`

### .nextPage()
`(default、edit)模式时，前进到下一张图片`

### .indexPage()
`(default、edit)模式时，前进到指定页码数`
