## Seasonal Theme — Subtle Autumn

본 프로젝트는 가을 시즌에 제작·제출되는 프로젝트이므로 기존 디자인 시스템을 유지하면서 **아주 은은한 가을 분위기**를 보조적으로 반영한다.

가을 테마가 화면의 주제가 되어서는 안 된다.

사용자가 화면을 처음 보았을 때는 기존의 clean, generous, neutral-anchored 디자인으로 인식하고, 자세히 보았을 때 배경의 따뜻한 색감과 작은 단풍 디테일을 통해 가을 분위기를 느낄 수 있는 수준을 목표로 한다.

가을 분위기와 기본 UI의 비중은 대략 다음과 같이 유지한다.

```text
Core Design System: 80~90%
Autumn Seasonal Accent: 10~20%
```

즉, "가을 테마 UI"가 아니라 **기존 UI에 은은한 가을 계절감을 더한 형태**를 목표로 한다.

### Visual Direction

전체 UI는 기존 design system의 clean, generous, neutral-anchored 스타일을 그대로 유지한다.

가을 분위기는 다음 요소를 통해서만 제한적으로 표현한다.

- 약간 따뜻한 white / off-white 배경
- 매우 연한 cream / beige tint
- 낮은 채도의 muted orange 또는 brown accent
- 낮은 opacity의 단풍잎(maple leaf) 장식
- Hero나 넓은 여백 영역의 작은 seasonal decoration
- Footer 또는 section boundary의 미세한 autumn detail

색상 자체보다 **배경 온도와 작은 장식**을 이용해 계절감을 표현하는 것을 우선한다.

화면 전체를 주황색, 갈색, 붉은색 계열로 만들지 않는다.

### Autumn Color Palette

가을색은 강한 색상이 아니라 neutral에 가까운 muted tone을 사용한다.

권장 seasonal palette:

```text
autumn-background: #FFFCF8
autumn-cream:      #FAF5EE
autumn-beige:      #F1E8DC
autumn-orange:     #D9A875
autumn-brick:      #B98267
autumn-brown:      #8F7461
autumn-olive:      #929176
```

기본 surface는 white 또는 기존 neutral surface를 유지한다.

`autumn-orange`, `autumn-brick`, `autumn-brown`, `autumn-olive`는 넓은 면적에 사용하지 않는다.

이 색상들은 다음과 같은 작은 accent에만 사용한다.

- decorative leaf
- seasonal badge
- illustration detail
- subtle icon accent
- small section decoration
- background ornament

Primary action, form validation, success, warning, danger 등 기능적인 의미를 가진 색상은 기존 semantic token을 그대로 사용한다.

Autumn palette가 기존 semantic color의 의미를 대체해서는 안 된다.

### Maple Leaf Decoration

단풍잎은 가을 분위기를 전달하는 **보조 장식**으로만 사용한다.

권장 표현 방식:

- thin line-art maple leaf
- simple flat silhouette
- abstract maple shape
- partial leaf
- cropped leaf
- corner decoration
- very subtle scattered leaves

실제 단풍 사진이나 사실적인 잎사귀 texture는 사용하지 않는다.

단풍잎은 SVG 또는 단순화된 vector graphic을 우선 사용한다.

기본 opacity:

```text
recommended: 0.025 ~ 0.06
maximum: 0.08
```

단풍잎이 화면을 처음 보았을 때 즉시 눈에 띈다면 너무 강한 것으로 판단한다.

단풍잎은 콘텐츠보다 먼저 시선을 끌어서는 안 된다.

### Decoration Placement

가을 장식을 사용할 수 있는 영역:

```text
Hero
Page background
Section background
Intro / Cover
Empty state
Onboarding
Footer
넓은 여백 영역
```

가을 장식을 최소화하거나 사용하지 않는 영역:

```text
Input
Form
Table
Modal
Dropdown
Navigation
Search Result
Dense List
Data-heavy Card
CTA 내부
텍스트 바로 뒤
```

정보 밀도가 높은 영역에서는 기존 neutral surface를 그대로 유지한다.

### Page Background

전체 페이지의 기본 배경은 순백색 또는 매우 약한 warm off-white를 사용한다.

권장 예:

```css
background: #FFFCF8;
```

또는 기존 white surface를 유지하면서 특정 section에서만 `#FFFCF8` 또는 `#FAF5EE`를 사용할 수 있다.

모든 section을 서로 다른 가을색으로 칠하지 않는다.

가을 배경색은 화면을 따뜻하게 보이게 만드는 정도에 그쳐야 한다.

### Hero

Hero는 seasonal theme를 가장 적극적으로 적용할 수 있는 영역이지만, 이곳에서도 가을색을 강하게 표현하지 않는다.

권장 구성:

```text
white / warm off-white background
+ subtle warm tint
+ 1~3개의 low-opacity maple leaf decoration
+ 기존 typography
+ 기존 primary CTA
```

강한 orange / red / brown gradient는 사용하지 않는다.

필요하면 다음 정도의 매우 약한 warm gradient만 사용할 수 있다.

```css
background:
  linear-gradient(
    135deg,
    #FFFFFF 0%,
    #FFFCF8 55%,
    #FAF5EE 100%
  );
```

Gradient 자체가 명확하게 보이기보다는 사용자가 "배경이 조금 따뜻하다"고 느끼는 수준이 적절하다.

Hero 안의 단풍잎 역시 low opacity로 처리한다.

예:

```css
opacity: 0.04;
```

잎의 크기와 회전값을 조금씩 다르게 할 수 있지만 많은 수의 잎을 반복해서 배치하지 않는다.

### Components

다음 핵심 컴포넌트는 기존 design system을 그대로 따른다.

```text
Button
Icon Button
Input
Select
Checkbox
Radio
Switch
Chip
Badge
Tabs
Card
Table
Modal
Dropdown
Pagination
Tooltip
Toast
Navigation
```

Seasonal theme를 이유로 다음 속성을 임의 변경하지 않는다.

- component hierarchy
- typography hierarchy
- spacing
- radius
- border system
- focus state
- disabled state
- validation state
- semantic status color
- primary action hierarchy

특히 모든 Button, Card, Input을 autumn color로 변경하지 않는다.

### Buttons

Primary CTA는 기존 primary color를 유지한다.

가을 분위기를 위해 primary button을 orange, brown, brick으로 변경하지 않는다.

Autumn accent가 필요한 경우 CTA 주변의 background decoration 또는 adjacent illustration에서 표현한다.

즉:

```text
Primary CTA = 기존 디자인 시스템
Seasonal Decoration = 주변 배경
```

의 관계를 유지한다.

### Cards

카드는 기존 디자인 시스템과 동일하게 neutral surface를 사용한다.

기본적으로:

```text
white / neutral background
+ 1px subtle border
+ minimal or no shadow
```

구조를 유지한다.

카드 전체 배경을 beige, orange, red, brown으로 채우지 않는다.

카드 안에 단풍 패턴을 반복해서 넣지 않는다.

Seasonal decoration이 필요한 경우 카드 바깥 background에 배치한다.

### Typography

Typography hierarchy는 기존 design.md의 규칙을 그대로 따른다.

가을 테마를 표현하기 위해 decorative font, serif font, handwriting font 등을 새롭게 추가하지 않는다.

Typography 자체보다는 background와 decoration으로 계절감을 표현한다.

본문 가독성을 항상 seasonal styling보다 우선한다.

### Seasonal Accent Rule

가을 분위기는 다음 우선순위로 표현한다.

```text
1. Background warmth
2. Small maple leaf decoration
3. Muted seasonal accent
4. Seasonal illustration
```

즉, 강한 orange 색상을 사용하는 것보다 white background를 약간 따뜻하게 만드는 것을 먼저 고려한다.

한 화면에서 눈에 띄는 autumn accent color는 가능하면 1개를 사용한다.

필요한 경우 최대 2개까지 사용할 수 있다.

여러 가을색을 같은 강도로 동시에 사용하지 않는다.

예:

```text
Base:
white + warm off-white + neutral

Accent:
muted orange
```

또는:

```text
Base:
white + cream + neutral

Accent:
soft brown
```

정도가 적절하다.

### Illustration Style

가을 관련 일러스트가 필요한 경우 다음 스타일을 사용한다.

```text
simple
flat
geometric
minimal
low saturation
clean vector
```

다음 스타일은 사용하지 않는다.

```text
photorealistic autumn leaves
dense forest texture
watercolor texture
glossy leaves
3D leaf rendering
high-detail illustration
heavy shadow
glow
```

### Motion

단풍잎이 계속 떨어지는 animation은 기본적으로 사용하지 않는다.

특히 다음 animation을 사용하지 않는다.

- continuously falling leaves
- floating leaves
- parallax leaves
- rotating leaves
- random particle animation

계절감보다 UI 안정성과 집중도를 우선한다.

Animation이 필요한 경우 기존 design system의 짧고 절제된 transition 규칙을 유지한다.

### Responsive Behavior

모바일에서는 seasonal decoration을 더 줄인다.

Desktop에서 배경에 2~3개의 단풍 장식이 있다면 Mobile에서는 1~2개 정도만 유지하는 것을 권장한다.

좁은 화면에서 장식이 콘텐츠와 겹칠 경우 decoration을 축소하거나 숨긴다.

예:

```css
@media (max-width: 768px) {
  .autumn-decoration-secondary {
    display: none;
  }
}
```

Seasonal decoration 때문에 콘텐츠 영역의 width, padding, alignment를 변경하지 않는다.

### Dark Mode

Dark mode에서는 밝은 cream이나 beige background를 그대로 사용하지 않는다.

기존 dark surface를 유지하고 autumn palette는 매우 muted한 accent로만 사용한다.

예:

```text
dark neutral background
+ muted brick
+ muted brown
+ low-opacity maple decoration
```

Dark mode에서도 decoration opacity를 낮게 유지한다.

### Seasonal Tokens

새로운 스타일 값이 필요한 경우 기존 semantic token을 수정하지 않고 seasonal token으로 별도 관리한다.

예:

```css
--autumn-background: #FFFCF8;
--autumn-cream: #FAF5EE;
--autumn-beige: #F1E8DC;
--autumn-orange: #D9A875;
--autumn-brick: #B98267;
--autumn-brown: #8F7461;
--autumn-olive: #929176;
```

기존 `primary`, `danger`, `success`, `warning`, `surface`, `text` 등의 semantic token을 autumn token으로 덮어쓰지 않는다.

### Do

- 기존 디자인 시스템을 가장 우선한다.
- 기본 UI를 neutral하게 유지한다.
- white에 가까운 warm background를 사용한다.
- 배경의 온도로 먼저 가을 느낌을 만든다.
- 단풍잎은 작고 연하게 사용한다.
- 단풍잎 opacity를 매우 낮게 유지한다.
- Hero와 넓은 여백에서만 seasonal accent를 조금 더 사용한다.
- 콘텐츠와 장식 사이에 충분한 여백을 확보한다.
- 기존 component를 최대한 재사용한다.
- 모바일에서는 decoration을 줄인다.

### Don't

- 화면 전체를 orange / brown / red로 만들지 않는다.
- 강한 가을색을 primary theme로 사용하지 않는다.
- 모든 section에 단풍잎을 넣지 않는다.
- 모든 card에 단풍잎을 넣지 않는다.
- 단풍잎을 큰 크기와 높은 opacity로 사용하지 않는다.
- 텍스트 바로 뒤에 단풍 패턴을 넣지 않는다.
- Primary CTA를 가을색으로 변경하지 않는다.
- Semantic colors를 autumn palette로 교체하지 않는다.
- Card surface를 orange / brown / beige로 채우지 않는다.
- 실제 단풍 사진을 반복 background로 사용하지 않는다.
- 높은 채도의 red / orange / yellow를 동시에 사용하지 않는다.
- 과도한 gradient를 사용하지 않는다.
- glassmorphism을 추가하지 않는다.
- seasonal styling을 이유로 shadow를 늘리지 않는다.
- glow 효과를 사용하지 않는다.
- animation으로 낙엽을 계속 떨어뜨리지 않는다.
- 이모지를 계절 장식으로 사용하지 않는다.
- 가을 테마를 이유로 기존 layout을 변경하지 않는다.

### Priority

디자인 규칙이 충돌할 경우 다음 우선순위를 따른다.

```text
1. Usability / Accessibility
2. Existing Design System
3. Component Consistency
4. Content Readability
5. Autumn Seasonal Theme
6. Decorative Detail
```

Seasonal styling은 항상 기능성과 디자인 시스템보다 낮은 우선순위를 가진다.

### Target Impression

최종 화면의 인상은 다음 순서를 목표로 한다.

```text
첫인상
→ 깔끔하고 정돈된 현대적인 서비스 UI

조금 더 보았을 때
→ 전체 색감이 살짝 따뜻함

자세히 보았을 때
→ 배경과 작은 단풍 디테일 때문에 가을 분위기가 느껴짐
```

사용자가 처음 화면을 보자마자 "가을 테마 사이트"라고 느낀다면 seasonal styling이 너무 강한 것이다.

가장 이상적인 결과는:

> "전체적으로 깔끔한데, 자세히 보니 가을 느낌이 은은하게 들어가 있네."

라고 느껴지는 수준이다.

### 지도 표현

첫 화면의 강원도 시·군 지도는 경계 아래에 얇은 두께와 약한 그림자를 두어 살짝 떠 있는 것처럼 보이게 한다. 데스크톱에서만 지도를 조금 기울이고 모바일에서는 기울임을 없애 이름과 선택 영역을 읽기 쉽게 유지한다. 실제 지형의 높낮이를 나타내는 3D 지도가 아니라 지역 선택을 돕는 시각 효과다.
