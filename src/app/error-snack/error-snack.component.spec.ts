import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorSnackComponent } from './error-snack.component';

describe('ErrorSnackComponent', () => {
  let component: ErrorSnackComponent;
  let fixture: ComponentFixture<ErrorSnackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ErrorSnackComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorSnackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
